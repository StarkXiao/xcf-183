export type ExpiryWarningLevel = 'critical' | 'warning' | 'attention';

export interface Product {
  id: string;
  name: string;
  category: 'beverage' | 'rice_ball' | 'expiring';
  stock: number;
  maxStock: number;
  price: number;
  expirationDate?: string;
  shelfLocation: string;
  outOfStockRegistered?: boolean;
}

export interface ScheduleItem {
  id: string;
  productId: string;
  productName: string;
  time: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedDuration: number;
  originalTime: string;
  isOverdue?: boolean;
  estimatedStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  reminderSent?: boolean;
  prerequisiteIds?: string[];
  isBlocked?: boolean;
  blockReason?: string;
}

export interface Reminder {
  id: string;
  productId: string;
  productName: string;
  message: string;
  time: string;
  type: 'low_stock' | 'expiring' | 'scheduled' | 'overdue';
  scheduleId?: string;
  expiryLevel?: ExpiryWarningLevel;
}

export interface Statistics {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  expiringCount: number;
  expiringCritical: number;
  expiringWarning: number;
  expiringAttention: number;
  scheduledTasks: number;
  completedTasks: number;
  overdueTasks: number;
  estimatedFinishTime?: string;
}

export interface StockSnapshot {
  date: string;
  products: Product[];
  schedule: ScheduleItem[];
  reminders: Reminder[];
  snapshotTime: string;
}

export interface HistoryRecord {
  date: string;
  completedTasks: number;
  totalTasks: number;
  totalReplenished: number;
  lowStockAtEnd: number;
}

export type ViewMode = 'current' | 'history';

export interface TimeSlotStats {
  timeSlot: string;
  startTime: string;
  endTime: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  isBottleneck: boolean;
}

