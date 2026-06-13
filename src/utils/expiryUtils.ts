import type { Product, ExpiryWarningLevel } from '../types';

export const EXPIRY_WARNING_THRESHOLDS = {
  critical: 1,
  warning: 3,
  attention: 7,
};

export const getDaysUntilExpiry = (expirationDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getExpiryWarningLevel = (expirationDate?: string): ExpiryWarningLevel | null => {
  if (!expirationDate) return null;
  const daysLeft = getDaysUntilExpiry(expirationDate);
  if (daysLeft <= EXPIRY_WARNING_THRESHOLDS.critical) return 'critical';
  if (daysLeft <= EXPIRY_WARNING_THRESHOLDS.warning) return 'warning';
  if (daysLeft <= EXPIRY_WARNING_THRESHOLDS.attention) return 'attention';
  return null;
};

export const isExpiringProduct = (product: Product): boolean => {
  return getExpiryWarningLevel(product.expirationDate) !== null;
};

export const getExpiryWarningConfig = (level: ExpiryWarningLevel) => {
  const configs = {
    critical: {
      label: '紧急临期',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-300',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      progressColor: 'bg-red-500',
      suggestion: '建议立即降价促销或调拨，避免过期损耗',
      action: '紧急处理',
    },
    warning: {
      label: '临期警告',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      progressColor: 'bg-orange-500',
      suggestion: '建议重点关注，安排促销活动加快销售',
      action: '重点关注',
    },
    attention: {
      label: '临期提醒',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-700',
      progressColor: 'bg-yellow-500',
      suggestion: '建议正常销售，持续关注库存周转',
      action: '持续关注',
    },
  };
  return configs[level];
};

export const getExpiryProductsByLevel = (products: Product[], level: ExpiryWarningLevel): Product[] => {
  return products.filter((product) => getExpiryWarningLevel(product.expirationDate) === level);
};

export const getExpiryStatistics = (products: Product[]) => {
  let criticalCount = 0;
  let warningCount = 0;
  let attentionCount = 0;

  products.forEach((product) => {
    const level = getExpiryWarningLevel(product.expirationDate);
    if (level === 'critical') criticalCount++;
    else if (level === 'warning') warningCount++;
    else if (level === 'attention') attentionCount++;
  });

  return {
    critical: criticalCount,
    warning: warningCount,
    attention: attentionCount,
    total: criticalCount + warningCount + attentionCount,
  };
};
