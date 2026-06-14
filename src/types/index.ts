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

export interface Employee {
  id: string;
  name: string;
  position: string;
  phone: string;
  status: 'active' | 'leave' | 'off';
  avatarColor: string;
}

export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  isCrossDay: boolean;
  requiredStaff: number;
}

export interface WorkArea {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  areaId: string;
  date: string;
  notes?: string;
}

export type AttendanceStatus = 'checked_in' | 'checked_out' | 'absent' | 'late' | 'early_leave' | 'on_leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  assignmentId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  actualWorkMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  notes?: string;
}

export interface WorkHoursStats {
  employeeId: string;
  employeeName: string;
  totalDays: number;
  totalWorkHours: number;
  regularHours: number;
  overtimeHours: number;
  lateCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  attendanceRate: number;
}

export interface DailyAttendanceSummary {
  date: string;
  totalScheduled: number;
  totalCheckedIn: number;
  totalAbsent: number;
  totalLate: number;
  attendanceRate: number;
}

export type ScrapReason = 'near_expiry' | 'expired' | 'damaged' | 'quality_issue' | 'other';

export type ScrapReviewStatus = 'pending' | 'approved' | 'rejected';

export type ScrapConfirmationStatus = 'unconfirmed' | 'confirmed';

export interface ScrapItem {
  id: string;
  productId: string;
  productName: string;
  category: 'beverage' | 'rice_ball' | 'expiring';
  reason: ScrapReason;
  quantity: number;
  unitPrice: number;
  totalLoss: number;
  shelfLocation: string;
  expirationDate?: string;
  registeredBy: string;
  registeredTime: string;
  reviewStatus: ScrapReviewStatus;
  reviewedBy?: string;
  reviewedTime?: string;
  reviewComment?: string;
  confirmationStatus: ScrapConfirmationStatus;
  confirmedBy?: string;
  confirmedTime?: string;
  notes?: string;
  month: string;
}

export interface ScrapReasonOption {
  value: ScrapReason;
  label: string;
  color: string;
}

export interface MonthlyLossStats {
  month: string;
  totalItems: number;
  totalLoss: number;
  approvedCount: number;
  confirmedCount: number;
  pendingCount: number;
  rejectedCount: number;
  byReason: {
    reason: ScrapReason;
    label: string;
    count: number;
    totalLoss: number;
  }[];
  byCategory: {
    category: string;
    label: string;
    count: number;
    totalLoss: number;
  }[];
  items: ScrapItem[];
}

export type HandoverEventType = 'normal' | 'incident' | 'equipment' | 'customer' | 'safety' | 'other';
export type HandoverTodoPriority = 'high' | 'medium' | 'low';
export type HandoverTodoStatus = 'pending' | 'in_progress' | 'completed';
export type HandoverExceptionSeverity = 'critical' | 'warning' | 'info';
export type HandoverLogStatus = 'draft' | 'pending_signature' | 'completed';

export interface HandoverEvent {
  id: string;
  type: HandoverEventType;
  description: string;
  occurredAt: string;
  reportedBy: string;
  resolved: boolean;
  resolution?: string;
}

export interface HandoverTodo {
  id: string;
  description: string;
  priority: HandoverTodoPriority;
  status: HandoverTodoStatus;
  assignedTo?: string;
  dueBy?: string;
  notes?: string;
}

export interface HandoverException {
  id: string;
  severity: HandoverExceptionSeverity;
  category: string;
  description: string;
  occurredAt: string;
  reportedBy: string;
  actionTaken?: string;
  followUpRequired: boolean;
  followUpNotes?: string;
}

export interface ElectronicSignature {
  signerName: string;
  signerRole: string;
  signedAt: string;
  signatureData: string;
}

export interface ShiftHandoverLog {
  id: string;
  shiftDate: string;
  outgoingShift: string;
  incomingShift: string;
  outgoingOperator: string;
  incomingOperator: string;
  events: HandoverEvent[];
  todos: HandoverTodo[];
  exceptions: HandoverException[];
  generalNotes: string;
  outgoingSignature?: ElectronicSignature;
  incomingSignature?: ElectronicSignature;
  status: HandoverLogStatus;
  createdAt: string;
  completedAt?: string;
}

