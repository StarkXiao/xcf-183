import type {
  PaymentMethodStats,
  CashDiscrepancyRecord,
  ReconciliationData,
  CashDiscrepancyType,
  DiscrepancyStatus,
  PaymentRecord,
  PaymentMethod,
} from '../types';

const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
  other: '其他',
};

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
  wechat: 'from-green-50 to-green-100 text-green-700 border-green-200',
  alipay: 'from-sky-50 to-sky-100 text-sky-700 border-sky-200',
  card: 'from-violet-50 to-violet-100 text-violet-700 border-violet-200',
  other: 'from-gray-50 to-gray-100 text-gray-700 border-gray-200',
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: '💰',
  wechat: '💬',
  alipay: '📱',
  card: '💳',
  other: '📦',
};

export const getPaymentMethodName = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_NAMES[method];
};

export const getPaymentMethodColor = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_COLORS[method];
};

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_ICONS[method];
};

export const calculateCashDifference = (
  expected: number,
  actual: number
): { amount: number; type: CashDiscrepancyType | null } => {
  const diff = Math.round((actual - expected) * 100) / 100;
  if (diff === 0) return { amount: 0, type: null };
  return { amount: Math.abs(diff), type: diff > 0 ? 'over' : 'short' };
};

export const createDiscrepancyRecord = (
  shiftId: string,
  type: CashDiscrepancyType,
  amount: number,
  reportedBy: string,
  description: string,
  reportedTime: string
): CashDiscrepancyRecord => {
  return {
    id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    shiftId,
    type,
    amount,
    reportedBy,
    reportedTime,
    description,
    status: 'pending',
  };
};

export const reviewDiscrepancy = (
  record: CashDiscrepancyRecord,
  status: DiscrepancyStatus,
  reviewedBy: string,
  reviewComment: string,
  reviewedTime: string
): CashDiscrepancyRecord => {
  return {
    ...record,
    status,
    reviewedBy,
    reviewComment,
    reviewedTime,
  };
};

export const aggregatePaymentRecords = (records: PaymentRecord[]): PaymentMethodStats[] => {
  const grouped: Record<PaymentMethod, {
    totalAmount: number;
    orderCount: number;
    refundCount: number;
    refundAmount: number;
  }> = {
    cash: { totalAmount: 0, orderCount: 0, refundCount: 0, refundAmount: 0 },
    wechat: { totalAmount: 0, orderCount: 0, refundCount: 0, refundAmount: 0 },
    alipay: { totalAmount: 0, orderCount: 0, refundCount: 0, refundAmount: 0 },
    card: { totalAmount: 0, orderCount: 0, refundCount: 0, refundAmount: 0 },
    other: { totalAmount: 0, orderCount: 0, refundCount: 0, refundAmount: 0 },
  };

  for (const record of records) {
    grouped[record.method].totalAmount += record.amount;
    grouped[record.method].orderCount += record.orderCount;
  }

  const totalAmount = Object.values(grouped).reduce((sum, g) => sum + g.totalAmount, 0);

  return (Object.keys(grouped) as PaymentMethod[]).map(method => ({
    method,
    methodName: PAYMENT_METHOD_NAMES[method],
    totalAmount: Math.round(grouped[method].totalAmount * 100) / 100,
    orderCount: grouped[method].orderCount,
    refundCount: grouped[method].refundCount,
    refundAmount: Math.round(grouped[method].refundAmount * 100) / 100,
    netAmount: Math.round((grouped[method].totalAmount - grouped[method].refundAmount) * 100) / 100,
    percentage: totalAmount > 0
      ? Math.round((grouped[method].totalAmount / totalAmount) * 10000) / 100
      : 0,
  }));
};

export const getDiscrepancyStatusInfo = (status: DiscrepancyStatus): {
  label: string; color: string; bgColor: string } => {
    switch (status) {
      case 'pending':
        return { label: '待审核', color: 'text-amber-700', bgColor: 'bg-amber-100' };
      case 'approved':
        return { label: '已通过', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
      case 'rejected':
        return { label: '已驳回', color: 'text-rose-700', bgColor: 'bg-rose-100' };
    }
  };

export const getDiscrepancyTypeInfo = (type: CashDiscrepancyType): {
  label: string; color: string; prefix: string } => {
    switch (type) {
      case 'short':
        return { label: '短款', color: 'text-rose-600', prefix: '-' };
      case 'over':
        return { label: '长款', color: 'text-emerald-600', prefix: '+' };
    }
  };

export const validateDiscrepancyAmount = (amount: number): string | null => {
  if (!amount || amount <= 0) return '金额必须大于0';
  if (amount > 10000) return '金额过大，请核实后再登记';
  return null;
};

export const validateDiscrepancyDescription = (description: string): string | null => {
  if (!description || description.trim().length === 0) return '请填写差异原因说明';
  if (description.trim().length < 5) return '原因说明至少5个字符';
  return null;
};

export const closeShift = (data: ReconciliationData): ReconciliationData => {
  const pendingCount = data.discrepancies.filter(d => d.status === 'pending').length;
  if (pendingCount > 0) {
    throw new Error(`还有${pendingCount}条差异记录待审核，无法结班`);
  }
  return {
    ...data,
    summary: {
      ...data.summary,
      isClosed: true,
    },
  };
};

export const canCloseShift = (data: ReconciliationData): { canClose: boolean; reason?: string } => {
  const pendingCount = data.discrepancies.filter(d => d.status === 'pending').length;
  if (pendingCount > 0) {
    return { canClose: false, reason: `还有${pendingCount}条差异记录待审核` };
  }
  return { canClose: true };
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};
