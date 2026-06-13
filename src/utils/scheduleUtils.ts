import type { ScheduleItem, Reminder } from '../types';

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
  const sortedSchedule = sortScheduleByTime(schedule, currentTime);

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

export const calculateTotalEstimatedFinishTime = (schedule: ScheduleItem[], currentTime: string): string | undefined => {
  const sortedPending = sortScheduleByTime(
    schedule.filter(s => s.status !== 'completed'),
    currentTime
  );

  if (sortedPending.length === 0) return undefined;

  const inProgressTask = sortedPending.find(s => s.status === 'in_progress');
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
