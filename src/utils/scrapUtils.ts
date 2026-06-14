import type { ScrapItem, ScrapReason, ScrapReviewStatus, ScrapReasonOption, MonthlyLossStats } from '../types';

export const SCRAP_REASON_OPTIONS: ScrapReasonOption[] = [
  { value: 'near_expiry', label: '临期下架', color: 'text-orange-600 bg-orange-50' },
  { value: 'expired', label: '已过期', color: 'text-red-600 bg-red-50' },
  { value: 'damaged', label: '破损报废', color: 'text-purple-600 bg-purple-50' },
  { value: 'quality_issue', label: '质量问题', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'other', label: '其他原因', color: 'text-gray-600 bg-gray-50' },
];

export const getScrapReasonLabel = (reason: ScrapReason): string => {
  return SCRAP_REASON_OPTIONS.find(o => o.value === reason)?.label ?? '未知';
};

export const getScrapReasonColor = (reason: ScrapReason): string => {
  return SCRAP_REASON_OPTIONS.find(o => o.value === reason)?.color ?? 'text-gray-600 bg-gray-50';
};

export const getReviewStatusLabel = (status: ScrapReviewStatus): string => {
  const labels: Record<ScrapReviewStatus, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  };
  return labels[status];
};

export const getReviewStatusColor = (status: ScrapReviewStatus): string => {
  const colors: Record<ScrapReviewStatus, string> = {
    pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    approved: 'text-green-700 bg-green-50 border-green-200',
    rejected: 'text-red-700 bg-red-50 border-red-200',
  };
  return colors[status];
};

export const getConfirmationStatusLabel = (status: ScrapItem['confirmationStatus']): string => {
  return status === 'confirmed' ? '已确认' : '未确认';
};

export const getConfirmationStatusColor = (status: ScrapItem['confirmationStatus']): string => {
  return status === 'confirmed'
    ? 'text-green-700 bg-green-50 border-green-200'
    : 'text-gray-600 bg-gray-50 border-gray-200';
};

export const getCategoryLabel = (category: ScrapItem['category']): string => {
  const labels: Record<ScrapItem['category'], string> = {
    beverage: '饮料',
    rice_ball: '鲜食',
    expiring: '临期品',
  };
  return labels[category];
};

export const calculateMonthlyLossStats = (items: ScrapItem[], month: string): MonthlyLossStats => {
  const monthItems = items.filter(item => item.month === month);

  const approvedCount = monthItems.filter(i => i.reviewStatus === 'approved').length;
  const confirmedCount = monthItems.filter(i => i.confirmationStatus === 'confirmed').length;
  const pendingCount = monthItems.filter(i => i.reviewStatus === 'pending').length;
  const rejectedCount = monthItems.filter(i => i.reviewStatus === 'rejected').length;

  const reasonMap = new Map<ScrapReason, { count: number; totalLoss: number }>();
  monthItems.forEach(item => {
    const existing = reasonMap.get(item.reason) ?? { count: 0, totalLoss: 0 };
    reasonMap.set(item.reason, {
      count: existing.count + 1,
      totalLoss: Math.round((existing.totalLoss + item.totalLoss) * 100) / 100,
    });
  });

  const byReason = Array.from(reasonMap.entries()).map(([reason, data]) => ({
    reason,
    label: getScrapReasonLabel(reason),
    count: data.count,
    totalLoss: data.totalLoss,
  }));

  const categoryMap = new Map<string, { count: number; totalLoss: number }>();
  monthItems.forEach(item => {
    const existing = categoryMap.get(item.category) ?? { count: 0, totalLoss: 0 };
    categoryMap.set(item.category, {
      count: existing.count + 1,
      totalLoss: Math.round((existing.totalLoss + item.totalLoss) * 100) / 100,
    });
  });

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    label: getCategoryLabel(category as ScrapItem['category']),
    count: data.count,
    totalLoss: data.totalLoss,
  }));

  return {
    month,
    totalItems: monthItems.length,
    totalLoss: Math.round(monthItems.reduce((sum, i) => sum + i.totalLoss, 0) * 100) / 100,
    approvedCount,
    confirmedCount,
    pendingCount,
    rejectedCount,
    byReason,
    byCategory,
    items: monthItems,
  };
};

export const getAvailableMonths = (items: ScrapItem[]): string[] => {
  const months = new Set(items.map(i => i.month));
  return Array.from(months).sort().reverse();
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const createScrapItem = (
  productId: string,
  productName: string,
  category: ScrapItem['category'],
  reason: ScrapReason,
  quantity: number,
  unitPrice: number,
  shelfLocation: string,
  registeredBy: string,
  expirationDate?: string,
  notes?: string,
): ScrapItem => {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    id: `scrap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId,
    productName,
    category,
    reason,
    quantity,
    unitPrice,
    totalLoss: Math.round(quantity * unitPrice * 100) / 100,
    shelfLocation,
    expirationDate,
    registeredBy,
    registeredTime: timeStr,
    reviewStatus: 'pending',
    confirmationStatus: 'unconfirmed',
    notes,
    month,
  };
};

export const reviewScrapItem = (
  item: ScrapItem,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  reviewComment?: string,
): ScrapItem => {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    ...item,
    reviewStatus: status,
    reviewedBy,
    reviewedTime: timeStr,
    reviewComment,
  };
};

export const confirmScrapItem = (
  item: ScrapItem,
  confirmedBy: string,
): ScrapItem => {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    ...item,
    confirmationStatus: 'confirmed',
    confirmedBy,
    confirmedTime: timeStr,
  };
};

export const formatLossAmount = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const getMonthLabel = (month: string): string => {
  const [year, mon] = month.split('-');
  return `${year}年${parseInt(mon)}月`;
};
