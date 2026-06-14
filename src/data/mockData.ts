import type { Product, ScheduleItem, Reminder, StockSnapshot, ShiftRevenue, PaymentMethod } from '../types';
import { formatDate } from '../utils/historyUtils';

export const mockProducts: Product[] = [
  { id: '1', name: '可口可乐 500ml', category: 'beverage', stock: 15, maxStock: 30, price: 3.5, shelfLocation: 'A1-01' },
  { id: '2', name: '百事可乐 500ml', category: 'beverage', stock: 8, maxStock: 30, price: 3.5, shelfLocation: 'A1-02' },
  { id: '3', name: '农夫山泉 550ml', category: 'beverage', stock: 25, maxStock: 40, price: 2.0, shelfLocation: 'A1-03' },
  { id: '4', name: '怡宝矿泉水 555ml', category: 'beverage', stock: 5, maxStock: 40, price: 1.5, shelfLocation: 'A1-04' },
  { id: '5', name: '红牛 250ml', category: 'beverage', stock: 12, maxStock: 20, price: 6.0, shelfLocation: 'A2-01' },
  { id: '6', name: '东鹏特饮 250ml', category: 'beverage', stock: 18, maxStock: 20, price: 5.5, shelfLocation: 'A2-02' },
  { id: '7', name: '饭团-金枪鱼', category: 'rice_ball', stock: 6, maxStock: 15, price: 8.5, shelfLocation: 'B1-01' },
  { id: '8', name: '饭团-照烧鸡肉', category: 'rice_ball', stock: 10, maxStock: 15, price: 8.0, shelfLocation: 'B1-02' },
  { id: '9', name: '饭团-梅干', category: 'rice_ball', stock: 4, maxStock: 12, price: 7.5, shelfLocation: 'B1-03' },
  { id: '10', name: '饭团-三文鱼', category: 'rice_ball', stock: 7, maxStock: 15, price: 9.0, shelfLocation: 'B1-04' },
  { id: '11', name: '三明治-火腿蛋', category: 'rice_ball', stock: 3, maxStock: 10, price: 12.0, shelfLocation: 'B2-01', expirationDate: '2026-06-14' },
  { id: '12', name: '关东煮-萝卜', category: 'rice_ball', stock: 20, maxStock: 30, price: 3.0, shelfLocation: 'B3-01' },
  { id: '13', name: '便当-红烧排骨', category: 'rice_ball', stock: 2, maxStock: 8, price: 18.0, shelfLocation: 'B4-01', expirationDate: '2026-06-13' },
  { id: '14', name: '便当-宫保鸡丁', category: 'rice_ball', stock: 5, maxStock: 8, price: 16.0, shelfLocation: 'B4-02', expirationDate: '2026-06-15' },
  { id: '15', name: '酸奶-原味', category: 'beverage', stock: 3, maxStock: 20, price: 5.0, shelfLocation: 'C1-01', expirationDate: '2026-06-13' },
  { id: '16', name: '牛奶-纯牛奶', category: 'beverage', stock: 10, maxStock: 25, price: 6.5, shelfLocation: 'C1-02', expirationDate: '2026-06-16' },
  { id: '17', name: '三明治-金枪鱼', category: 'rice_ball', stock: 4, maxStock: 10, price: 13.0, shelfLocation: 'B2-02', expirationDate: '2026-06-15' },
  { id: '18', name: '便当-鱼香肉丝', category: 'rice_ball', stock: 6, maxStock: 8, price: 17.0, shelfLocation: 'B4-03', expirationDate: '2026-06-17' },
  { id: '19', name: '酸奶-草莓味', category: 'beverage', stock: 8, maxStock: 20, price: 5.5, shelfLocation: 'C1-03', expirationDate: '2026-06-18' },
  { id: '20', name: '面包-全麦', category: 'rice_ball', stock: 12, maxStock: 20, price: 8.0, shelfLocation: 'B5-01', expirationDate: '2026-06-20' },
  { id: '21', name: '蛋糕-提拉米苏', category: 'rice_ball', stock: 5, maxStock: 10, price: 15.0, shelfLocation: 'B5-02', expirationDate: '2026-06-19' },
  { id: '22', name: '牛奶-低脂', category: 'beverage', stock: 15, maxStock: 25, price: 7.0, shelfLocation: 'C1-04', expirationDate: '2026-06-25' },
];

export const mockSchedule: ScheduleItem[] = [
  { id: 's1', productId: '4', productName: '怡宝矿泉水 555ml', time: '22:00', quantity: 20, status: 'pending', estimatedDuration: 15, originalTime: '22:00' },
  { id: 's2', productId: '2', productName: '百事可乐 500ml', time: '22:30', quantity: 15, status: 'pending', estimatedDuration: 12, originalTime: '22:30', prerequisiteIds: ['s1'] },
  { id: 's3', productId: '7', productName: '饭团-金枪鱼', time: '23:00', quantity: 10, status: 'in_progress', estimatedDuration: 10, originalTime: '23:00', actualStartTime: '23:02', prerequisiteIds: ['s1', 's2'] },
  { id: 's4', productId: '11', productName: '三明治-火腿蛋', time: '23:30', quantity: 8, status: 'pending', estimatedDuration: 8, originalTime: '23:30', prerequisiteIds: ['s3'] },
  { id: 's5', productId: '13', productName: '便当-红烧排骨', time: '00:00', quantity: 5, status: 'completed', estimatedDuration: 8, originalTime: '00:00', actualStartTime: '00:01', actualEndTime: '00:07' },
  { id: 's6', productId: '15', productName: '酸奶-原味', time: '00:30', quantity: 15, status: 'pending', estimatedDuration: 10, originalTime: '00:30', prerequisiteIds: ['s5'] },
  { id: 's7', productId: '9', productName: '饭团-梅干', time: '01:00', quantity: 8, status: 'pending', estimatedDuration: 8, originalTime: '01:00', prerequisiteIds: ['s3', 's6'] },
  { id: 's8', productId: '5', productName: '红牛 250ml', time: '01:30', quantity: 10, status: 'pending', estimatedDuration: 10, originalTime: '01:30' },
];

export const mockReminders: Reminder[] = [
  { id: 'r1', productId: '4', productName: '怡宝矿泉水 555ml', message: '库存不足，当前库存: 5', time: '22:00', type: 'low_stock' },
  { id: 'r5', productId: '7', productName: '饭团-金枪鱼', message: '补货任务已开始', time: '23:00', type: 'scheduled' },
];

const getDateStr = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
};

const shiftDate = (expirationDate: string | undefined, daysAgo: number): string | undefined => {
  if (!expirationDate) return undefined;
  const date = parseDate(expirationDate);
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
};

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const createHistoricalProducts = (daysAgo: number): Product[] => {
  const stockMultiplier = 1 - daysAgo * 0.05;
  return mockProducts.map(p => ({
    ...p,
    stock: Math.max(1, Math.floor(p.stock * stockMultiplier + Math.random() * 5)),
    expirationDate: shiftDate(p.expirationDate, daysAgo),
  }));
};

const createHistoricalSchedule = (daysAgo: number): ScheduleItem[] => {
  const completionRate = daysAgo >= 3 ? 1 : daysAgo >= 1 ? 0.75 : 0.2;
  return mockSchedule.map((s, idx) => {
    const shouldComplete = idx / mockSchedule.length < completionRate;
    const shouldStart = idx / mockSchedule.length < completionRate + 0.1;
    return {
      ...s,
      status: shouldComplete ? 'completed' : shouldStart ? 'in_progress' : 'pending',
      actualStartTime: shouldStart ? s.time : undefined,
      actualEndTime: shouldComplete
        ? `${String(Math.min(23, parseInt(s.time.split(':')[0]) + Math.floor(s.estimatedDuration / 60))).padStart(2, '0')}:${String((parseInt(s.time.split(':')[1]) + s.estimatedDuration) % 60).padStart(2, '0')}`
        : undefined,
      isOverdue: !shouldStart && daysAgo >= 1,
    };
  });
};

export const mockHistoricalSnapshots: StockSnapshot[] = [
  {
    date: getDateStr(3),
    products: createHistoricalProducts(3),
    schedule: createHistoricalSchedule(3),
    reminders: [],
    snapshotTime: `${getDateStr(3)}T02:30:00Z`,
  },
  {
    date: getDateStr(2),
    products: createHistoricalProducts(2),
    schedule: createHistoricalSchedule(2),
    reminders: [],
    snapshotTime: `${getDateStr(2)}T02:15:00Z`,
  },
  {
    date: getDateStr(1),
    products: createHistoricalProducts(1),
    schedule: createHistoricalSchedule(1),
    reminders: [
      { id: `hr-${getDateStr(1)}-1`, productId: '4', productName: '怡宝矿泉水 555ml', message: '库存不足', time: '23:00', type: 'low_stock' },
    ],
    snapshotTime: `${getDateStr(1)}T01:45:00Z`,
  },
];

const paymentMethods: PaymentMethod[] = ['cash', 'wechat', 'alipay', 'card', 'other'];
const productNames = ['可口可乐 500ml', '百事可乐 500ml', '农夫山泉 550ml', '红牛 250ml', '饭团-金枪鱼', '饭团-照烧鸡肉', '三明治-火腿蛋', '便当-红烧排骨', '酸奶-原味', '牛奶-纯牛奶'];

const randomPaymentMethod = (): PaymentMethod => {
  const weights = [0.25, 0.35, 0.3, 0.08, 0.02];
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return paymentMethods[i];
  }
  return 'cash';
};

const randomProductName = () => productNames[Math.floor(Math.random() * productNames.length)];

const generatePayments = (count: number, dateStr: string) => {
  const payments = [];
  for (let i = 0; i < count; i++) {
    const hour = 20 + Math.floor(Math.random() * 10);
    const adjustedHour = hour >= 24 ? hour - 24 : hour;
    const minute = Math.floor(Math.random() * 60);
    const amount = Math.round((Math.random() * 50 + 2) * 100) / 100;
    payments.push({
      id: `pay-${dateStr}-${i}`,
      orderNo: `ORD${dateStr.replace(/-/g, '')}${String(i + 1).padStart(4, '0')}`,
      time: `${String(adjustedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      amount,
      paymentMethod: randomPaymentMethod(),
      operator: '张夜班',
      productName: Math.random() > 0.3 ? randomProductName() : undefined,
    });
  }
  return payments.sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number);
    const [bh, bm] = b.time.split(':').map(Number);
    const aVal = ah < 12 ? ah + 24 : ah;
    const bVal = bh < 12 ? bh + 24 : bh;
    return (aVal * 60 + am) - (bVal * 60 + bm);
  });
};

export const mockShiftRevenues: ShiftRevenue[] = [
  {
    shiftId: `shift-${getDateStr(2)}`,
    shiftName: '夜班',
    shiftDate: getDateStr(2),
    startTime: '20:00',
    endTime: '06:00',
    operator: '张夜班',
    totalOrders: 87,
    totalRevenue: 2856.50,
    expectedCash: 714.13,
    actualCash: 714.13,
    payments: generatePayments(87, getDateStr(2)),
    discrepancies: [],
  },
  {
    shiftId: `shift-${getDateStr(1)}`,
    shiftName: '夜班',
    shiftDate: getDateStr(1),
    startTime: '20:00',
    endTime: '06:00',
    operator: '张夜班',
    totalOrders: 103,
    totalRevenue: 3421.80,
    expectedCash: 855.45,
    actualCash: 850.45,
    payments: generatePayments(103, getDateStr(1)),
    discrepancies: [
      {
        id: `disc-${getDateStr(1)}-1`,
        shiftId: `shift-${getDateStr(1)}`,
        type: 'short',
        amount: 5.00,
        registeredTime: '05:50',
        registeredBy: '张夜班',
        reason: '找零时可能多找了零钱，疑似支付20元商品误按50元找零',
        status: 'approved',
        reviewedBy: '李店长',
        reviewedTime: '09:30',
        reviewComment: '情况属实，已记录，下次注意',
      },
    ],
  },
  {
    shiftId: `shift-${getDateStr(0)}`,
    shiftName: '夜班',
    shiftDate: getDateStr(0),
    startTime: '20:00',
    endTime: '06:00',
    operator: '张夜班',
    totalOrders: 76,
    totalRevenue: 2468.90,
    expectedCash: 617.23,
    actualCash: 620.23,
    payments: generatePayments(76, getDateStr(0)),
    discrepancies: [
      {
        id: `disc-${getDateStr(0)}-1`,
        shiftId: `shift-${getDateStr(0)}`,
        type: 'over',
        amount: 3.00,
        registeredTime: '05:45',
        registeredBy: '张夜班',
        reason: '有顾客买东西扫码付完款走了，后来又回来付了一次现金，重复收款',
        status: 'pending',
      },
    ],
  },
];
