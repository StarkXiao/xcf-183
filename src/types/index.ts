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

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card' | 'other';

export interface PaymentRecord {
  id: string;
  orderNo: string;
  time: string;
  amount: number;
  paymentMethod: PaymentMethod;
  operator: string;
  productName?: string;
}

export interface PaymentMethodStats {
  method: PaymentMethod;
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export type DiscrepancyType = 'short' | 'over';
export type DiscrepancyStatus = 'pending' | 'approved' | 'rejected';

export interface CashDiscrepancy {
  id: string;
  shiftId: string;
  type: DiscrepancyType;
  amount: number;
  registeredTime: string;
  registeredBy: string;
  reason: string;
  status: DiscrepancyStatus;
  reviewedBy?: string;
  reviewedTime?: string;
  reviewComment?: string;
}

export interface ShiftRevenue {
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  operator: string;
  totalOrders: number;
  totalRevenue: number;
  expectedCash: number;
  actualCash: number;
  payments: PaymentRecord[];
  discrepancies: CashDiscrepancy[];
}

export interface ShiftRevenueSummary {
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  operator: string;
  totalOrders: number;
  totalRevenue: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  paymentStats: PaymentMethodStats[];
  discrepancies: CashDiscrepancy[];
  pendingDiscrepancies: number;
  isBalanced: boolean;
}

