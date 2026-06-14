import type { ProcessingTask, ProcessingStep, ProcessingStatistics, Reminder, ProcessingStation } from '../types';
import { getCurrentTime, timeToMinutes, calculateTimeDifference } from './scheduleUtils';

const STATUS_ORDER: ProcessingTask['status'][] = ['queued', 'preparing', 'cooking', 'assembling', 'packaging', 'completed'];

export const getStatusIndex = (status: ProcessingTask['status']): number => {
  return STATUS_ORDER.indexOf(status);
};

export const getStatusLabel = (status: ProcessingTask['status']): string => {
  const labels: Record<ProcessingTask['status'], string> = {
    queued: '排队中',
    preparing: '准备中',
    cooking: '加工中',
    assembling: '组装中',
    packaging: '包装中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status];
};

export const getStatusColor = (status: ProcessingTask['status']): string => {
  const colors: Record<ProcessingTask['status'], string> = {
    queued: 'bg-gray-100 text-gray-600 border-gray-200',
    preparing: 'bg-blue-50 text-blue-600 border-blue-200',
    cooking: 'bg-orange-50 text-orange-600 border-orange-200',
    assembling: 'bg-purple-50 text-purple-600 border-purple-200',
    packaging: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    completed: 'bg-green-50 text-green-600 border-green-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  };
  return colors[status];
};

export const getPriorityLabel = (priority: ProcessingTask['priority']): string => {
  const labels: Record<ProcessingTask['priority'], string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority];
};

export const getPriorityColor = (priority: ProcessingTask['priority']): string => {
  const colors: Record<ProcessingTask['priority'], string> = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600 animate-pulse',
  };
  return colors[priority];
};

export const getCategoryLabel = (category: ProcessingTask['category']): string => {
  const labels: Record<ProcessingTask['category'], string> = {
    rice_ball: '饭团',
    sandwich: '三明治',
    bento: '便当',
    dessert: '甜点',
    other: '其他',
  };
  return labels[category];
};

export const getWarningLevelColor = (level?: ProcessingTask['warningLevel']): string => {
  if (!level || level === 'normal') return 'border-transparent';
  if (level === 'warning') return 'border-yellow-400 shadow-yellow-100';
  return 'border-red-500 shadow-red-100';
};

export const calculateStepProgress = (steps: ProcessingStep[]): number => {
  if (steps.length === 0) return 0;
  const completed = steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
  const inProgress = steps.filter(s => s.status === 'in_progress').length;
  return Math.round(((completed + inProgress * 0.5) / steps.length) * 100);
};

export const calculateTaskProgress = (task: ProcessingTask): number => {
  const statusIndex = getStatusIndex(task.status);
  if (statusIndex === -1 || task.status === 'cancelled') return task.progress;
  if (task.status === 'completed') return 100;
  
  const statusProgress = (statusIndex / (STATUS_ORDER.length - 2)) * 80;
  const stepProgress = calculateStepProgress(task.steps) * 0.2;
  
  return Math.min(100, Math.round(statusProgress + stepProgress));
};

export const isProcessingOverdue = (task: ProcessingTask, currentTime: string): { isOverdue: boolean; overdueMinutes: number } => {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return { isOverdue: false, overdueMinutes: 0 };
  }

  const scheduledMinutes = timeToMinutes(task.scheduledTime, currentTime);
  const currentMinutes = timeToMinutes(currentTime, currentTime);
  const overdueMinutes = currentMinutes - scheduledMinutes - task.estimatedDuration;

  if (overdueMinutes > 0) {
    return { isOverdue: true, overdueMinutes };
  }
  return { isOverdue: false, overdueMinutes: 0 };
};

export const getWarningLevel = (overdueMinutes: number): ProcessingTask['warningLevel'] => {
  if (overdueMinutes <= 0) return 'normal';
  if (overdueMinutes <= 10) return 'warning';
  return 'critical';
};

export const checkProcessingOverdue = (tasks: ProcessingTask[], currentTime: string): ProcessingTask[] => {
  return tasks.map(task => {
    const { isOverdue, overdueMinutes } = isProcessingOverdue(task, currentTime);
    const warningLevel = getWarningLevel(overdueMinutes);
    const progress = calculateTaskProgress(task);
    return { ...task, isOverdue, overdueMinutes, warningLevel, progress };
  });
};

export const generateProcessingReminders = (
  tasks: ProcessingTask[],
  existingReminders: Reminder[],
  currentTime: string
): { reminders: Reminder[]; updatedTasks: ProcessingTask[] } => {
  const newReminders: Reminder[] = [];
  
  const updatedTasks = tasks.map(task => {
    if (!task.isOverdue || task.status === 'completed' || task.status === 'cancelled') {
      return task;
    }

    let taskUpdates: Partial<ProcessingTask> = {};
    const overdueMsg = task.overdueMinutes! > 60
      ? `${Math.floor(task.overdueMinutes! / 60)}小时${task.overdueMinutes! % 60}分钟`
      : `${task.overdueMinutes!}分钟`;

    if (task.warningLevel === 'warning' && !task.warningReminderSent) {
      const reminder: Reminder = {
        id: `processing-warning-${task.id}-${Date.now()}`,
        productId: task.productId,
        productName: task.productName,
        message: `【超时预警】${task.productName} 加工任务已逾期${overdueMsg}，当前进度: ${task.progress}%，请加快处理！`,
        time: currentTime,
        type: 'processing_warning',
        processingTaskId: task.id,
      };

      const alreadyExists = existingReminders.some(
        r => r.processingTaskId === task.id && r.type === 'processing_warning'
      );

      if (!alreadyExists) {
        newReminders.push(reminder);
      }
      taskUpdates.warningReminderSent = true;
    }

    if (task.warningLevel === 'critical' && !task.criticalReminderSent) {
      const reminder: Reminder = {
        id: `processing-critical-${task.id}-${Date.now()}`,
        productId: task.productId,
        productName: task.productName,
        message: `【严重超时】${task.productName} 加工任务已严重逾期${overdueMsg}，当前进度: ${task.progress}%，请立即处理！`,
        time: currentTime,
        type: 'processing_overdue',
        processingTaskId: task.id,
      };

      const alreadyExists = existingReminders.some(
        r => r.processingTaskId === task.id && r.type === 'processing_overdue'
      );

      if (!alreadyExists) {
        newReminders.push(reminder);
      }
      taskUpdates.criticalReminderSent = true;
      if (!task.warningReminderSent) {
        taskUpdates.warningReminderSent = true;
      }
    }

    return Object.keys(taskUpdates).length > 0 ? { ...task, ...taskUpdates } : task;
  });

  return {
    reminders: [...existingReminders, ...newReminders],
    updatedTasks,
  };
};

export const updateTaskStatus = (
  tasks: ProcessingTask[],
  taskId: string,
  newStatus: ProcessingTask['status'],
  operator?: string
): ProcessingTask[] => {
  const now = getCurrentTime();
  
  return tasks.map(task => {
    if (task.id !== taskId) return task;

    const updates: Partial<ProcessingTask> = { status: newStatus };
    
    if (newStatus !== 'queued' && !task.actualStartTime) {
      updates.actualStartTime = now;
    }
    
    if (newStatus === 'queued') {
      updates.actualStartTime = undefined;
      updates.actualEndTime = undefined;
      updates.warningReminderSent = false;
      updates.criticalReminderSent = false;
      updates.isOverdue = false;
      updates.overdueMinutes = 0;
      updates.warningLevel = 'normal';
    }
    
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      updates.actualEndTime = now;
      updates.progress = newStatus === 'completed' ? 100 : task.progress;
      updates.isOverdue = false;
      updates.overdueMinutes = 0;
      updates.warningLevel = 'normal';
    }
    
    if (operator) {
      updates.operator = operator;
    }

    return { ...task, ...updates };
  });
};

export const updateStepStatus = (
  tasks: ProcessingTask[],
  taskId: string,
  stepId: string,
  newStatus: ProcessingStep['status'],
  operator?: string
): ProcessingTask[] => {
  const now = getCurrentTime();
  
  return tasks.map(task => {
    if (task.id !== taskId) return task;

    const updatedSteps = task.steps.map(step => {
      if (step.id !== stepId) return step;
      
      const updates: Partial<ProcessingStep> = { status: newStatus };
      
      if (newStatus === 'in_progress' && !step.startTime) {
        updates.startTime = now;
      }
      
      if ((newStatus === 'completed' || newStatus === 'skipped') && !step.endTime) {
        updates.endTime = now;
      }
      
      if (operator) {
        updates.operator = operator;
      }

      return { ...step, ...updates };
    });

    const progress = calculateTaskProgress({ ...task, steps: updatedSteps });

    return { ...task, steps: updatedSteps, progress };
  });
};

export const sortProcessingTasks = (tasks: ProcessingTask[], currentTime: string): ProcessingTask[] => {
  const priorityOrder: Record<ProcessingTask['priority'], number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  return [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.isOverdue && b.isOverdue) {
      return (b.overdueMinutes || 0) - (a.overdueMinutes || 0);
    }
    
    return timeToMinutes(a.scheduledTime, currentTime) - timeToMinutes(b.scheduledTime, currentTime);
  });
};

export const calculateProcessingStatistics = (
  tasks: ProcessingTask[],
  stations: ProcessingStation[],
  currentTime: string
): ProcessingStatistics => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => 
    ['preparing', 'cooking', 'assembling', 'packaging'].includes(t.status)
  ).length;
  const pendingTasks = tasks.filter(t => t.status === 'queued').length;
  const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'completed' && t.status !== 'cancelled').length;

  const completedOnTime = tasks.filter(t => {
    if (t.status !== 'completed' || !t.actualEndTime || !t.actualStartTime) return false;
    const actualDuration = calculateTimeDifference(t.actualEndTime, t.actualStartTime, currentTime);
    return actualDuration <= t.estimatedDuration;
  }).length;

  const onTimeCompletionRate = completedTasks > 0 
    ? Math.round((completedOnTime / completedTasks) * 100) 
    : 100;

  const totalActualDuration = tasks
    .filter(t => t.status === 'completed' && t.actualEndTime && t.actualStartTime)
    .reduce((sum, t) => sum + calculateTimeDifference(t.actualEndTime!, t.actualStartTime!, currentTime), 0);
  
  const averageProcessingTime = completedTasks > 0 
    ? Math.round(totalActualDuration / completedTasks) 
    : 0;

  const todayOutput = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.quantity, 0);

  const defectiveTasks = tasks.filter(t => t.qualityCheck?.passed === false).length;
  const defectiveRate = completedTasks > 0 
    ? Math.round((defectiveTasks / completedTasks) * 100 * 10) / 10 
    : 0;

  const stationUtilization = stations.map(station => {
    const stationTasks = tasks.filter(t => t.station === station.id);
    const completedStationTasks = stationTasks.filter(t => t.status === 'completed');
    const totalDuration = completedStationTasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
    const utilizationRate = totalDuration > 0 ? Math.min(100, Math.round((totalDuration / 480) * 100)) : 0;
    
    return {
      stationId: station.id,
      stationName: station.name,
      utilizationRate,
    };
  });

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    averageProcessingTime,
    onTimeCompletionRate,
    todayOutput,
    defectiveRate,
    stationUtilization,
  };
};

export const getTasksByStation = (tasks: ProcessingTask[], stationId: string): ProcessingTask[] => {
  return tasks.filter(t => t.station === stationId);
};

export const getTasksByStatus = (tasks: ProcessingTask[], status: ProcessingTask['status']): ProcessingTask[] => {
  return tasks.filter(t => t.status === status);
};

export const getTasksByCategory = (tasks: ProcessingTask[], category: ProcessingTask['category']): ProcessingTask[] => {
  return tasks.filter(t => t.category === category);
};

export const canAdvanceStatus = (task: ProcessingTask): boolean => {
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  const currentIndex = getStatusIndex(task.status);
  return currentIndex < STATUS_ORDER.length - 2;
};

export const advanceTaskStatus = (
  tasks: ProcessingTask[],
  taskId: string,
  operator?: string
): ProcessingTask[] => {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !canAdvanceStatus(task)) return tasks;

  const currentIndex = getStatusIndex(task.status);
  const nextStatus = STATUS_ORDER[currentIndex + 1];
  
  return updateTaskStatus(tasks, taskId, nextStatus, operator);
};

export const estimateFinishTime = (task: ProcessingTask, currentTime: string): string | undefined => {
  if (task.status === 'completed' || task.status === 'cancelled') return task.actualEndTime;
  
  const currentMinutes = timeToMinutes(currentTime, currentTime);
  const progress = task.progress / 100;
  const elapsed = progress > 0 
    ? calculateTimeDifference(currentTime, task.actualStartTime || task.scheduledTime, currentTime) 
    : 0;
  const remaining = elapsed > 0 
    ? Math.round((elapsed / progress) - elapsed) 
    : task.estimatedDuration;
  
  const finishMinutes = currentMinutes + remaining;
  const hours = Math.floor(finishMinutes / 60) % 24;
  const mins = finishMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
