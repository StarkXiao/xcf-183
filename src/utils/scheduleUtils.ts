import type { ScheduleItem, Reminder } from '../types';

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const calculateTimeDifference = (time1: string, time2: string): number => {
  return timeToMinutes(time1) - timeToMinutes(time2);
};

export const isTaskOverdue = (task: ScheduleItem, currentTime: string): boolean => {
  if (task.status !== 'pending') return false;
  const scheduledTime = timeToMinutes(task.originalTime);
  const now = timeToMinutes(currentTime);
  const threshold = 5;
  return now > scheduledTime + threshold;
};

export const checkOverdueTasks = (schedule: ScheduleItem[], currentTime: string): ScheduleItem[] => {
  return schedule.map(task => {
    const isOverdue = isTaskOverdue(task, currentTime);
    return { ...task, isOverdue };
  });
};

export const recalculateSchedule = (schedule: ScheduleItem[], currentTime: string): ScheduleItem[] => {
  const sortedSchedule = [...schedule].sort((a, b) => 
    timeToMinutes(a.originalTime) - timeToMinutes(b.originalTime)
  );

  let currentTimePointer = timeToMinutes(currentTime);
  let hasOverdue = false;

  return sortedSchedule.map(task => {
    if (task.status === 'completed') {
      return task;
    }

    if (task.status === 'in_progress') {
      const taskStartTime = task.actualStartTime || task.originalTime;
      const elapsed = currentTimePointer - timeToMinutes(taskStartTime);
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
      const delayMinutes = calculateTimeDifference(currentTime, task.originalTime);
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
  const sortedPending = schedule
    .filter(s => s.status !== 'completed')
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  if (sortedPending.length === 0) return undefined;

  const inProgressTask = sortedPending.find(s => s.status === 'in_progress');
  let totalMinutes = timeToMinutes(currentTime);

  if (inProgressTask) {
    const elapsed = calculateTimeDifference(currentTime, inProgressTask.actualStartTime || inProgressTask.originalTime);
    const remaining = Math.max(0, inProgressTask.estimatedDuration - elapsed);
    totalMinutes += remaining;
  }

  const pendingTasks = sortedPending.filter(s => s.status === 'pending');
  for (const task of pendingTasks) {
    totalMinutes += task.estimatedDuration;
  }

  return minutesToTime(totalMinutes);
};
