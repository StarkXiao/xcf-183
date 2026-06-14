import type { DeliveryAppointment, DeliveryItem, DeliveryDiscrepancy, DeliverySlotAvailability } from '../types';
import { DELIVERY_TIME_SLOTS } from '../data/mockData';
import { getCurrentTime } from './scheduleUtils';

export const DELIVERY_STATUS_CONFIG = {
  pending: { label: '待处理', color: 'text-gray-600 bg-gray-100' },
  registered: { label: '已预约', color: 'text-blue-600 bg-blue-50' },
  arrived: { label: '已到达', color: 'text-purple-600 bg-purple-50' },
  verifying: { label: '核验中', color: 'text-orange-600 bg-orange-50' },
  completed: { label: '已完成', color: 'text-green-600 bg-green-50' },
  cancelled: { label: '已取消', color: 'text-red-600 bg-red-50' },
  discrepancy: { label: '有差异', color: 'text-red-600 bg-red-50' },
};

export const DISCREPANCY_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  short: { label: '数量短少', color: 'text-red-600 bg-red-50' },
  over: { label: '数量超出', color: 'text-orange-600 bg-orange-50' },
  damaged: { label: '商品破损', color: 'text-red-600 bg-red-50' },
  expired: { label: '商品过期', color: 'text-red-600 bg-red-50' },
  wrong_item: { label: '货不对板', color: 'text-yellow-600 bg-yellow-50' },
};

export const getDeliveryNo = (dateStr: string, index: number): string => {
  const datePart = dateStr.replace(/-/g, '');
  return `DLV${datePart}${String(index + 1).padStart(3, '0')}`;
};

export const generateQRCode = (deliveryNo: string, supplierName: string): string => {
  const supplierCode = supplierName.substring(0, 4).toUpperCase();
  return `${deliveryNo}-${supplierCode}`;
};

export const getDeliverySlotAvailability = (
  date: string,
  deliveries: DeliveryAppointment[],
  maxPerSlot: number = 3
): DeliverySlotAvailability[] => {
  return DELIVERY_TIME_SLOTS.map(slot => {
    const [startTime] = slot.split('-');
    const bookings = deliveries.filter(d => 
      d.scheduledDate === date && d.scheduledTime === startTime && d.status !== 'cancelled'
    ).length;
    
    return {
      timeSlot: slot,
      date,
      available: bookings < maxPerSlot,
      maxDeliveries: maxPerSlot,
      currentBookings: bookings,
    };
  });
};

export const getTodayDeliveries = (deliveries: DeliveryAppointment[], date: string): DeliveryAppointment[] => {
  return deliveries
    .filter(d => d.scheduledDate === date)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
};

export const getUpcomingDeliveries = (
  deliveries: DeliveryAppointment[],
  currentTime: string,
  limit: number = 5
): DeliveryAppointment[] => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  return deliveries
    .filter(d => {
      if (d.scheduledDate > todayStr) return true;
      if (d.scheduledDate < todayStr) return false;
      return d.scheduledTime >= currentTime;
    })
    .filter(d => d.status !== 'completed' && d.status !== 'cancelled')
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return a.scheduledTime.localeCompare(b.scheduledTime);
    })
    .slice(0, limit);
};

export const calculateDeliveryStats = (deliveries: DeliveryAppointment[], date: string) => {
  const todayDeliveries = getTodayDeliveries(deliveries, date);
  
  return {
    total: todayDeliveries.length,
    registered: todayDeliveries.filter(d => d.status === 'registered').length,
    arrived: todayDeliveries.filter(d => d.status === 'arrived' || d.status === 'verifying').length,
    completed: todayDeliveries.filter(d => d.status === 'completed').length,
    discrepancy: todayDeliveries.filter(d => d.status === 'discrepancy').length,
    pendingDiscrepancies: deliveries.filter(d => 
      d.discrepancies.some(disc => disc.status === 'pending')
    ).length,
    totalAmount: todayDeliveries.reduce((sum, d) => sum + d.totalAmount, 0),
    totalItems: todayDeliveries.reduce((sum, d) => 
      sum + d.items.reduce((s, item) => s + item.expectedQuantity, 0), 0
    ),
  };
};

export const updateDeliveryItem = (
  delivery: DeliveryAppointment,
  productId: string,
  actualQuantity: number
): DeliveryAppointment => {
  return {
    ...delivery,
    items: delivery.items.map(item =>
      item.productId === productId
        ? { ...item, actualQuantity, checked: true }
        : item
    ),
  };
};

export const markItemAsChecked = (
  delivery: DeliveryAppointment,
  productId: string,
  checked: boolean = true
): DeliveryAppointment => {
  return {
    ...delivery,
    items: delivery.items.map(item =>
      item.productId === productId
        ? { ...item, checked }
        : item
    ),
  };
};

export const markAllItemsAsChecked = (delivery: DeliveryAppointment): DeliveryAppointment => {
  return {
    ...delivery,
    items: delivery.items.map(item => ({ ...item, checked: true })),
  };
};

export const hasAllItemsChecked = (delivery: DeliveryAppointment): boolean => {
  return delivery.items.every(item => item.checked);
};

export const calculateDiscrepancies = (items: DeliveryItem[]): DeliveryItem[] => {
  return items.filter(item => 
    item.actualQuantity !== undefined && 
    item.actualQuantity !== item.expectedQuantity
  );
};

export const createDiscrepancy = (
  deliveryId: string,
  item: DeliveryItem,
  type: 'short' | 'over' | 'damaged' | 'expired' | 'wrong_item',
  description: string,
  photos: string[],
  reportedBy: string
): DeliveryDiscrepancy => {
  const difference = (item.actualQuantity || 0) - item.expectedQuantity;
  
  return {
    id: `disc-${deliveryId}-${item.productId}-${Date.now()}`,
    deliveryId,
    productId: item.productId,
    productName: item.productName,
    type,
    expectedQuantity: item.expectedQuantity,
    actualQuantity: item.actualQuantity || 0,
    difference,
    description,
    photos,
    reportedTime: getCurrentTime(),
    reportedBy,
    status: 'pending',
  };
};

export const updateDeliveryStatus = (
  delivery: DeliveryAppointment,
  status: DeliveryAppointment['status'],
  operator?: string
): DeliveryAppointment => {
  const now = getCurrentTime();
  const updates: Partial<DeliveryAppointment> = { status };
  
  if (status === 'arrived') {
    updates.actualArrivalTime = now;
  } else if (status === 'completed') {
    updates.verifiedBy = operator || '系统';
    updates.verifiedTime = now;
  }
  
  return { ...delivery, ...updates };
};

export const validateDeliveryItems = (items: DeliveryItem[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (items.length === 0) {
    errors.push('请至少添加一个商品');
  }
  
  items.forEach((item, index) => {
    if (!item.productId || !item.productName) {
      errors.push(`第 ${index + 1} 个商品信息不完整`);
    }
    if (item.expectedQuantity <= 0) {
      errors.push(`${item.productName || `第 ${index + 1} 个商品`} 的数量必须大于0`);
    }
    if (item.price < 0) {
      errors.push(`${item.productName || `第 ${index + 1} 个商品`} 的价格不能为负数`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const calculateTotalAmount = (items: DeliveryItem[]): number => {
  return items.reduce((sum, item) => sum + item.expectedQuantity * item.price, 0);
};

export const getDeliveryById = (
  deliveries: DeliveryAppointment[],
  id: string
): DeliveryAppointment | undefined => {
  return deliveries.find(d => d.id === id);
};

export const getDeliveryByQRCode = (
  deliveries: DeliveryAppointment[],
  qrCode: string
): DeliveryAppointment | undefined => {
  return deliveries.find(d => d.qrCode === qrCode);
};

export const addDeliveryDiscrepancy = (
  delivery: DeliveryAppointment,
  discrepancy: DeliveryDiscrepancy
): DeliveryAppointment => {
  const updatedItems = delivery.items.map(item =>
    item.productId === discrepancy.productId
      ? { ...item, actualQuantity: discrepancy.actualQuantity, checked: true }
      : item
  );

  return {
    ...delivery,
    items: updatedItems,
    status: 'discrepancy',
    discrepancies: [...delivery.discrepancies, discrepancy],
  };
};

export const resolveDiscrepancy = (
  delivery: DeliveryAppointment,
  discrepancyId: string,
  resolution: string,
  resolvedBy: string
): DeliveryAppointment => {
  const now = getCurrentTime();
  
  const updatedDiscrepancies = delivery.discrepancies.map(d =>
    d.id === discrepancyId
      ? { ...d, status: 'resolved' as const, resolution, resolvedTime: now, resolvedBy }
      : d
  );
  
  const allResolved = updatedDiscrepancies.every(d => d.status !== 'pending');
  
  return {
    ...delivery,
    status: allResolved ? 'completed' : 'discrepancy',
    discrepancies: updatedDiscrepancies,
  };
};

export const formatDeliveryDate = (dateStr: string, timeStr: string): string => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  let dateLabel = dateStr;
  if (dateStr === todayStr) dateLabel = '今天';
  else if (dateStr === tomorrowStr) dateLabel = '明天';
  else if (dateStr === yesterdayStr) dateLabel = '昨天';
  
  return `${dateLabel} ${timeStr}`;
};