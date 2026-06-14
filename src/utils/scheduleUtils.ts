import type { ScheduleItem, Reminder, TimeSlotStats } from '../types';

const DAY_MINUTES = 24 * 60;
const DAY_THRESHOLD = 12;

const rawTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const detectCrossMidnight = (times: string[]): boolean => {
  if (times.length < 2) return false;
  const minutes = times.map(rawTimeToMinutes);
  const hasEvening = minutes.some(m => m >= DAY_THRESHOLD * 60);
  const hasMorning = minutes.some(m => m < DAY_THRESHOLD * 60);
  return hasEvening && hasMorning;
};

export const timeToMinutes = (time: string, referenceTime?: string): number => {
  const raw = rawTimeToMinutes(time);
  if (!referenceTime) {
    const baseline = raw >= DAY_THRESHOLD * 60 ? 0 : DAY_MINUTES;
    return raw + baseline;
  }
  const refRaw = rawTimeToMinutes(referenceTime);
  if (refRaw >= DAY_THRESHOLD * 60) {
    return raw >= DAY_THRESHOLD * 60 ? raw : raw + DAY_MINUTES;
  } else {
    return raw >= DAY_THRESHOLD * 60 ? raw - DAY_MINUTES : raw;
  }
};

export const minutesToTime = (minutes: number): string => {
  const normalizedMinutes = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const addMinutesToTime = (time: string, minutesToAdd: number, referenceTime?: string): string => {
  const totalMinutes = timeToMinutes(time, referenceTime) + minutesToAdd;
  return minutesToTime(totalMinutes);
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const calculateTimeDifference = (time1: string, time2: string, referenceTime?: string): number => {
  let ref = referenceTime;
  if (!ref) {
    const t1 = rawTimeToMinutes(time1);
    const t2 = rawTimeToMinutes(time2);
    ref = (t1 >= DAY_THRESHOLD * 60 || t2 >= DAY_THRESHOLD * 60) ? '20:00' : '08:00';
  }
  return timeToMinutes(time1, ref) - timeToMinutes(time2, ref);
};

export const isTaskOverdue = (task: ScheduleItem, currentTime: string): boolean => {
  if (task.status !== 'pending') return false;
  const threshold = 5;
  const diff = calculateTimeDifference(currentTime, task.originalTime, currentTime);
  return diff > threshold;
};

export const checkOverdueTasks = (schedule: ScheduleItem[], currentTime: string): ScheduleItem[] => {
  return schedule.map(task => {
    const isOverdue = isTaskOverdue(task, currentTime);
    return { ...task, isOverdue };
  });
};

export const sortScheduleByTime = (schedule: ScheduleItem[], referenceTime: string): ScheduleItem[] => {
  return [...schedule].sort((a, b) => 
    timeToMinutes(a.originalTime, referenceTime) - timeToMinutes(b.originalTime, referenceTime)
  );
};

export const recalculateSchedule = (schedule: ScheduleItem[], currentTime: string): ScheduleItem[] => {
  const scheduleWithDeps = checkTaskDependencies(schedule);
  const sortedSchedule = sortScheduleByTime(scheduleWithDeps, currentTime);

  let currentTimePointer = timeToMinutes(currentTime, currentTime);
  let hasOverdue = false;

  return sortedSchedule.map(task => {
    if (task.status === 'completed') {
      return task;
    }

    if (task.status === 'in_progress') {
      const taskStartTime = task.actualStartTime || task.originalTime;
      const elapsed = currentTimePointer - timeToMinutes(taskStartTime, currentTime);
      const remaining = Math.max(0, task.estimatedDuration - elapsed);
      currentTimePointer = currentTimePointer + remaining;
      return task;
    }

    if (task.isBlocked) {
      return task;
    }

    const isOverdue = isTaskOverdue(task, currentTime);
    if (isOverdue) {
      hasOverdue = true;
    }

    if (hasOverdue && task.status === 'pending') {
      const estimatedStartTime = minutesToTime(currentTimePointer);
      currentTimePointer += task.estimatedDuration;
      return {
        ...task,
        isOverdue,
        time: estimatedStartTime,
        estimatedStartTime,
      };
    }

    return { ...task, isOverdue };
  });
};

export const generateOverdueReminders = (
  schedule: ScheduleItem[],
  existingReminders: Reminder[],
  currentTime: string
): { reminders: Reminder[]; updatedSchedule: ScheduleItem[] } => {
  const newReminders: Reminder[] = [];
  const updatedSchedule = schedule.map(task => {
    if (task.isOverdue && !task.reminderSent && task.status === 'pending') {
      const delayMinutes = calculateTimeDifference(currentTime, task.originalTime, currentTime);
      const delayMsg = delayMinutes > 60 
        ? `${Math.floor(delayMinutes / 60)}小时${delayMinutes % 60}分钟` 
        : `${delayMinutes}分钟`;
      
      const reminder: Reminder = {
        id: `overdue-${task.id}-${Date.now()}`,
        productId: task.productId,
        productName: task.productName,
        message: `排程任务已逾期${delayMsg}未开始，请尽快处理！预计新开始时间: ${task.estimatedStartTime || task.time}`,
        time: currentTime,
        type: 'overdue',
        scheduleId: task.id,
      };
      
      const alreadyExists = existingReminders.some(
        r => r.scheduleId === task.id && r.type === 'overdue'
      );
      
      if (!alreadyExists) {
        newReminders.push(reminder);
      }
      
      return { ...task, reminderSent: true };
    }
    return task;
  });

  return {
    reminders: [...existingReminders, ...newReminders],
    updatedSchedule,
  };
};

export const getBlockedPrerequisites = (task: ScheduleItem, schedule: ScheduleItem[]): ScheduleItem[] => {
  if (!task.prerequisiteIds || task.prerequisiteIds.length === 0) return [];
  return schedule.filter(s => 
    task.prerequisiteIds!.includes(s.id) && s.status !== 'completed'
  );
};

export const isTaskBlocked = (task: ScheduleItem, schedule: ScheduleItem[]): boolean => {
  return getBlockedPrerequisites(task, schedule).length > 0;
};

export const getBlockReason = (task: ScheduleItem, schedule: ScheduleItem[]): string | undefined => {
  const blocked = getBlockedPrerequisites(task, schedule);
  if (blocked.length === 0) return undefined;
  const names = blocked.map(b => b.productName).join('、');
  return `等待前置任务完成: ${names}`;
};

export const checkTaskDependencies = (schedule: ScheduleItem[]): ScheduleItem[] => {
  return schedule.map(task => {
    if (task.status === 'completed') {
      return { ...task, isBlocked: false, blockReason: undefined };
    }
    const blocked = isTaskBlocked(task, schedule);
    const reason = getBlockReason(task, schedule);
    return { ...task, isBlocked: blocked, blockReason: reason };
  });
};

export const calculateTotalEstimatedFinishTime = (schedule: ScheduleItem[], currentTime: string): string | undefined => {
  const scheduleWithDeps = checkTaskDependencies(schedule);
  const sortedPending = sortScheduleByTime(
    scheduleWithDeps.filter(s => s.status !== 'completed' && !s.isBlocked),
    currentTime
  );

  if (sortedPending.length === 0) {
    const inProgressTask = scheduleWithDeps.find(s => s.status === 'in_progress');
    if (!inProgressTask) return undefined;
  }

  const inProgressTask = scheduleWithDeps.find(s => s.status === 'in_progress');
  let totalMinutes = timeToMinutes(currentTime, currentTime);

  if (inProgressTask) {
    const elapsed = calculateTimeDifference(
      currentTime,
      inProgressTask.actualStartTime || inProgressTask.originalTime,
      currentTime
    );
    const remaining = Math.max(0, inProgressTask.estimatedDuration - elapsed);
    totalMinutes += remaining;
  }

  const pendingTasks = sortedPending.filter(s => s.status === 'pending');
  for (const task of pendingTasks) {
    totalMinutes += task.estimatedDuration;
  }

  return minutesToTime(totalMinutes);
};

const TIME_SLOTS = [
  { slot: '20:00-22:00', start: '20:00', end: '22:00' },
  { slot: '22:00-00:00', start: '22:00', end: '00:00' },
  { slot: '00:00-02:00', start: '00:00', end: '02:00' },
  { slot: '02:00-04:00', start: '02:00', end: '04:00' },
  { slot: '04:00-06:00', start: '04:00', end: '06:00' },
  { slot: '06:00-08:00', start: '06:00', end: '08:00' },
];

export const calculateTimeSlotStats = (schedule: ScheduleItem[], currentTime: string): TimeSlotStats[] => {
  const stats = TIME_SLOTS.map(slot => ({
    timeSlot: slot.slot,
    startTime: slot.start,
    endTime: slot.end,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    isBottleneck: false,
  }));

  for (const task of schedule) {
    const taskTime = task.originalTime;
    const taskMinutes = timeToMinutes(taskTime, currentTime);

    for (let i = 0; i < stats.length; i++) {
      const slot = stats[i];
      const startMinutes = timeToMinutes(slot.startTime, currentTime);
      const endMinutes = timeToMinutes(slot.endTime, currentTime);
      const endAdjusted = endMinutes <= startMinutes ? endMinutes + DAY_MINUTES : endMinutes;
      const taskAdjusted = taskMinutes < startMinutes && slot.startTime >= '12:00' ? taskMinutes + DAY_MINUTES : taskMinutes;

      if (taskAdjusted >= startMinutes && taskAdjusted < endAdjusted) {
        slot.totalTasks++;
        if (task.status === 'completed') {
          slot.completedTasks++;
        }
        break;
      }
    }
  }

  for (const slot of stats) {
    slot.completionRate = slot.totalTasks > 0
      ? Math.round((slot.completedTasks / slot.totalTasks) * 100)
      : 0;
  }

  const slotsWithTasks = stats.filter(s => s.totalTasks > 0);
  const avgRate = slotsWithTasks.length > 0
    ? slotsWithTasks.reduce((sum, s) => sum + s.completionRate, 0) / slotsWithTasks.length
    : 0;

  for (const slot of stats) {
    if (slot.totalTasks > 0 && slot.completionRate < avgRate) {
      slot.isBottleneck = true;
    }
  }

  return stats;
};
