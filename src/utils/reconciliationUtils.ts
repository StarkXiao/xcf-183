import type {
  ShiftRevenue,
  ShiftRevenueSummary,
  PaymentMethodStats,
  PaymentMethod,
  PaymentRecord,
  CashDiscrepancy,
  DiscrepancyType,
  DiscrepancyStatus,
} from '../types';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
  other: '其他',
};

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: 'bg-green-500',
  wechat: 'bg-emerald-600',
  alipay: 'bg-blue-500',
  card: 'bg-purple-500',
  other: 'bg-gray-500',
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_LABELS[method];
};

export const getPaymentMethodColor = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_COLORS[method];
};

export const getDiscrepancyTypeLabel = (type: DiscrepancyType): string => {
  return type === 'short' ? '短款' : '长款';
};

export const getDiscrepancyStatusLabel = (status: DiscrepancyStatus): string => {
  const labels: Record<DiscrepancyStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };
  return labels[status];
};

export const calculatePaymentStats = (payments: PaymentRecord[]): PaymentMethodStats[] => {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const methodGroups = new Map<PaymentMethod, { count: number; amount: number }>();

  for (const payment of payments) {
    const current = methodGroups.get(payment.paymentMethod) || { count: 0, amount: 0 };
    methodGroups.set(payment.paymentMethod, {
      count: current.count + 1,
      amount: Math.round((current.amount + payment.amount) * 100) / 100,
    });
  }

  const result: PaymentMethodStats[] = [];
  for (const [method, data] of methodGroups.entries()) {
    result.push({
      method,
      label: PAYMENT_METHOD_LABELS[method],
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
    });
  }

  const methodOrder: PaymentMethod[] = ['cash', 'wechat', 'alipay', 'card', 'other'];
  return result.sort(
    (a, b) => methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method)
  );
};

export const buildShiftSummary = (shift: ShiftRevenue): ShiftRevenueSummary => {
  const paymentStats = calculatePaymentStats(shift.payments);
  const cashDifference = Math.round((shift.actualCash - shift.expectedCash) * 100) / 100;
  const pendingDiscrepancies = shift.discrepancies.filter(
    d => d.status === 'pending'
  ).length;
  const hasUnresolvedDiscrepancy = shift.discrepancies.some(
    d => d.status === 'pending' || d.status === 'rejected'
  );
  const isBalanced = Math.abs(cashDifference) < 0.01 && !hasUnresolvedDiscrepancy;

  return {
    shiftId: shift.shiftId,
    shiftName: shift.shiftName,
    shiftDate: shift.shiftDate,
    operator: shift.operator,
    totalOrders: shift.totalOrders,
    totalRevenue: shift.totalRevenue,
    expectedCash: shift.expectedCash,
    actualCash: shift.actualCash,
    cashDifference,
    paymentStats,
    discrepancies: shift.discrepancies,
    pendingDiscrepancies,
    isBalanced,
  };
};

export const createDiscrepancy = (
  shiftId: string,
  type: DiscrepancyType,
  amount: number,
  reason: string,
  registeredBy: string,
  registeredTime: string
): CashDiscrepancy => {
  return {
    id: `disc-${shiftId}-${Date.now()}`,
    shiftId,
    type,
    amount: Math.round(amount * 100) / 100,
    registeredTime,
    registeredBy,
    reason,
    status: 'pending',
  };
};

export const updateDiscrepancyStatus = (
  discrepancy: CashDiscrepancy,
  status: DiscrepancyStatus,
  reviewedBy: string,
  reviewedTime: string,
  reviewComment?: string
): CashDiscrepancy => {
  return {
    ...discrepancy,
    status,
    reviewedBy,
    reviewedTime,
    reviewComment,
  };
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const getTimeOfDayPaymentStats = (payments: PaymentRecord[]) => {
  const timeSlots = [
    { slot: '20:00-22:00', start: 20, end: 22, amount: 0, count: 0 },
    { slot: '22:00-00:00', start: 22, end: 24, amount: 0, count: 0 },
    { slot: '00:00-02:00', start: 0, end: 2, amount: 0, count: 0 },
    { slot: '02:00-04:00', start: 2, end: 4, amount: 0, count: 0 },
    { slot: '04:00-06:00', start: 4, end: 6, amount: 0, count: 0 },
  ];

  for (const payment of payments) {
    const hour = parseInt(payment.time.split(':')[0], 10);
    for (const slot of timeSlots) {
      if (slot.start < slot.end) {
        if (hour >= slot.start && hour < slot.end) {
          slot.amount = Math.round((slot.amount + payment.amount) * 100) / 100;
          slot.count++;
          break;
        }
      } else {
        if (hour >= slot.start || hour < slot.end) {
          slot.amount = Math.round((slot.amount + payment.amount) * 100) / 100;
          slot.count++;
          break;
        }
      }
    }
  }

  return timeSlots;
};
