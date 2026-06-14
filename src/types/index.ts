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
  type: 'low_stock' | 'expiring' | 'scheduled' | 'overdue' | 'processing_overdue' | 'processing_warning';
  scheduleId?: string;
  expiryLevel?: ExpiryWarningLevel;
  processingTaskId?: string;
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

export type DeliveryStatus = 'pending' | 'registered' | 'arrived' | 'verifying' | 'completed' | 'cancelled' | 'discrepancy';

export interface DeliveryItem {
  productId: string;
  productName: string;
  expectedQuantity: number;
  actualQuantity?: number;
  unit: string;
  price: number;
  checked?: boolean;
}

export interface DeliveryDiscrepancy {
  id: string;
  deliveryId: string;
  productId: string;
  productName: string;
  type: 'short' | 'over' | 'damaged' | 'expired' | 'wrong_item';
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  description: string;
  photos: string[];
  reportedTime: string;
  reportedBy: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolution?: string;
  resolvedTime?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  category: string;
}

export interface DeliveryAppointment {
  id: string;
  deliveryNo: string;
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  contactPhone: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedArrivalTime?: string;
  actualArrivalTime?: string;
  status: DeliveryStatus;
  items: DeliveryItem[];
  totalAmount: number;
  remarks?: string;
  registeredBy: string;
  registeredTime: string;
  verifiedBy?: string;
  verifiedTime?: string;
  discrepancies: DeliveryDiscrepancy[];
  licensePlate?: string;
  driverName?: string;
  temperature?: string;
  qrCode?: string;
}

export interface DeliverySlotAvailability {
  timeSlot: string;
  date: string;
  available: boolean;
  maxDeliveries: number;
  currentBookings: number;
}

export type ProcessingStatus = 'queued' | 'preparing' | 'cooking' | 'assembling' | 'packaging' | 'completed' | 'cancelled';

export type ProcessingPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;
  operator?: string;
  notes?: string;
}

export interface ProcessingTask {
  id: string;
  productId: string;
  productName: string;
  category: 'rice_ball' | 'sandwich' | 'bento' | 'dessert' | 'other';
  quantity: number;
  status: ProcessingStatus;
  priority: ProcessingPriority;
  scheduledTime: string;
  estimatedDuration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  progress: number;
  steps: ProcessingStep[];
  operator?: string;
  station: string;
  isOverdue?: boolean;
  overdueMinutes?: number;
  warningLevel?: 'normal' | 'warning' | 'critical';
  orderSource?: 'online' | 'in_store' | 'batch';
  orderId?: string;
  notes?: string;
  warningReminderSent?: boolean;
  criticalReminderSent?: boolean;
  temperatureCheck?: {
    required: boolean;
    actualTemp?: number;
    targetTemp?: number;
    checkedAt?: string;
  };
  qualityCheck?: {
    required: boolean;
    passed?: boolean;
    checkedAt?: string;
    checkedBy?: string;
    notes?: string;
  };
}

export interface ProcessingStation {
  id: string;
  name: string;
  type: 'rice' | 'filling' | 'assembly' | 'packaging';
  currentTaskId?: string;
  status: 'idle' | 'busy' | 'maintenance';
  efficiency: number;
}

export interface ProcessingStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageProcessingTime: number;
  onTimeCompletionRate: number;
  todayOutput: number;
  defectiveRate: number;
  stationUtilization: {
    stationId: string;
    stationName: string;
    utilizationRate: number;
  }[];
}

export interface ShelfReplenishmentRecord {
  id: string;
  shelfLocation: string;
  productId: string;
  productName: string;
  replenishTime: string;
  quantity: number;
  duration: number;
  date: string;
}

export interface ShelfStats {
  shelfLocation: string;
  shelfZone: string;
  shelfRow: number;
  shelfColumn: number;
  replenishCount: number;
  totalDuration: number;
  avgDuration: number;
  totalQuantity: number;
  heatLevel: 'low' | 'medium' | 'high' | 'critical';
  products: string[];
}

export interface ShelfLayout {
  zones: ShelfZone[];
  rows: number;
  columns: number;
}

export interface ShelfZone {
  zoneId: string;
  zoneName: string;
  shelves: ShelfCell[];
}

export interface ShelfCell {
  shelfLocation: string;
  row: number;
  column: number;
  zone: string;
  productCount: number;
  heatLevel: 'low' | 'medium' | 'high' | 'critical';
  stats?: ShelfStats;
}

export interface ShelfAdjustmentSuggestion {
  id: string;
  type: 'move_high_turnover' | 'move_low_turnover' | 'rearrange_zone' | 'optimize_path' | 'expand_capacity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  fromShelf?: string;
  toShelf?: string;
  productName?: string;
  expectedBenefit: string;
  reason: string;
}

export interface ShelfHeatmapData {
  layout: ShelfLayout;
  stats: ShelfStats[];
  suggestions: ShelfAdjustmentSuggestion[];
  totalReplenishments: number;
  avgReplenishTime: number;
  mostActiveShelf: string;
  leastActiveShelf: string;
  recordCount: number;
  snapshotCount: number;
}

