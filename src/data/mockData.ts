import type {
  Product,
  ScheduleItem,
  Reminder,
  StockSnapshot,
  ReconciliationData,
  ShiftRevenueSummary,
  PaymentMethodStats,
  CashDiscrepancyRecord,
  PaymentRecord,
} from '../types';
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

const TODAY = getDateStr(0);

export const mockShiftSummary: ShiftRevenueSummary = {
  id: 'shift-2026-06-14-night',
  shiftName: '夜班',
  shiftDate: TODAY,
  startTime: '22:00',
  endTime: '08:00',
  operatorName: '张伟',
  totalOrders: 186,
  totalRevenue: 6842.5,
  refundAmount: 128.0,
  netRevenue: 6714.5,
  isClosed: false,
};

export const mockPaymentStats: PaymentMethodStats[] = [
  {
    method: 'cash',
    methodName: '现金',
    totalAmount: 1850.0,
    orderCount: 62,
    refundCount: 2,
    refundAmount: 35.0,
    netAmount: 1815.0,
    percentage: 27.03,
  },
  {
    method: 'wechat',
    methodName: '微信支付',
    totalAmount: 2580.0,
    orderCount: 78,
    refundCount: 3,
    refundAmount: 58.0,
    netAmount: 2522.0,
    percentage: 37.56,
  },
  {
    method: 'alipay',
    methodName: '支付宝',
    totalAmount: 1960.5,
    orderCount: 40,
    refundCount: 1,
    refundAmount: 25.0,
    netAmount: 1935.5,
    percentage: 28.82,
  },
  {
    method: 'card',
    methodName: '银行卡',
    totalAmount: 380.0,
    orderCount: 5,
    refundCount: 0,
    refundAmount: 0,
    netAmount: 380.0,
    percentage: 5.66,
  },
  {
    method: 'other',
    methodName: '其他',
    totalAmount: 72.0,
    orderCount: 1,
    refundCount: 1,
    refundAmount: 10.0,
    netAmount: 62.0,
    percentage: 0.93,
  },
];

export const mockDiscrepancies: CashDiscrepancyRecord[] = [
  {
    id: 'disc-001',
    shiftId: 'shift-2026-06-14-night',
    type: 'short',
    amount: 12.5,
    reportedBy: '张伟',
    reportedTime: '02:15',
    description: '晚间23:40左右一笔现金交易找零有误，顾客离开后才发现，少收12.5元',
    status: 'pending',
  },
  {
    id: 'disc-002',
    shiftId: 'shift-2026-06-13-night',
    type: 'over',
    amount: 5.0,
    reportedBy: '李明',
    reportedTime: '06:30',
    description: '早间盘点时发现现金多出5元，可能是某笔交易少找零',
    status: 'approved',
    reviewedBy: '王店长',
    reviewedTime: '09:15',
    reviewComment: '金额较小，确认登记为长款',
  },
  {
    id: 'disc-003',
    shiftId: 'shift-2026-06-13-night',
    type: 'short',
    amount: 88.0,
    reportedBy: '李明',
    reportedTime: '07:00',
    description: '凌晨2点一笔大额交易出错，经核对监控确认',
    status: 'rejected',
    reviewedBy: '王店长',
    reviewedTime: '10:30',
    reviewComment: '经查实，该笔交易已正常入账，不存在短款，请重新核对',
  },
];

export const mockPaymentRecords: PaymentRecord[] = [
  { id: 'pay-1', method: 'wechat', amount: 42.5, orderCount: 1, time: '22:05' },
  { id: 'pay-2', method: 'cash', amount: 18.0, orderCount: 1, time: '22:12' },
  { id: 'pay-3', method: 'alipay', amount: 35.0, orderCount: 1, time: '22:20' },
  { id: 'pay-4', method: 'wechat', amount: 68.0, orderCount: 2, time: '22:35' },
  { id: 'pay-5', method: 'cash', amount: 25.5, orderCount: 1, time: '22:48' },
  { id: 'pay-6', method: 'wechat', amount: 156.0, orderCount: 4, time: '23:10' },
  { id: 'pay-7', method: 'alipay', amount: 89.0, orderCount: 2, time: '23:30' },
  { id: 'pay-8', method: 'card', amount: 128.0, orderCount: 1, time: '23:55' },
];

export const mockReconciliationData: ReconciliationData = {
  summary: mockShiftSummary,
  paymentStats: mockPaymentStats,
  discrepancies: mockDiscrepancies,
  expectedCashAmount: 1815.0,
  actualCashAmount: 1802.5,
};

export const createHistoricalReconciliation = (daysAgo: number): ReconciliationData => {
  const dateStr = getDateStr(daysAgo);
  const multiplier = 0.9 + Math.random() * 0.2;
  const baseRevenue = 6500 * multiplier;
  const refundPct = 0.01 + Math.random() * 0.015;
  const refundAmt = Math.round(baseRevenue * refundPct * 100) / 100;

  const cashRatio = 0.25 + Math.random() * 0.05;
  const wechatRatio = 0.35 + Math.random() * 0.05;
  const alipayRatio = 0.28 + Math.random() * 0.03;
  const cardRatio = 0.05 + Math.random() * 0.02;
  const otherRatio = 1 - cashRatio - wechatRatio - alipayRatio - cardRatio;

  const cashTotal = Math.round(baseRevenue * cashRatio * 100) / 100;
  const wechatTotal = Math.round(baseRevenue * wechatRatio * 100) / 100;
  const alipayTotal = Math.round(baseRevenue * alipayRatio * 100) / 100;
  const cardTotal = Math.round(baseRevenue * cardRatio * 100) / 100;
  const otherTotal = Math.round(baseRevenue * otherRatio * 100) / 100;

  const summary: ShiftRevenueSummary = {
    id: `shift-${dateStr}-night`,
    shiftName: '夜班',
    shiftDate: dateStr,
    startTime: '22:00',
    endTime: '08:00',
    operatorName: daysAgo % 2 === 0 ? '张伟' : '李明',
    totalOrders: Math.floor(180 * multiplier),
    totalRevenue: baseRevenue,
    refundAmount: refundAmt,
    netRevenue: Math.round((baseRevenue - refundAmt) * 100) / 100,
    isClosed: true,
  };

  const totalAmt = cashTotal + wechatTotal + alipayTotal + cardTotal + otherTotal;

  const paymentStats: PaymentMethodStats[] = [
    {
      method: 'cash',
      methodName: '现金',
      totalAmount: cashTotal,
      orderCount: Math.floor(60 * multiplier),
      refundCount: Math.floor(Math.random() * 3),
      refundAmount: Math.round(cashTotal * 0.015 * 100) / 100,
      netAmount: Math.round(cashTotal * 0.985 * 100) / 100,
      percentage: Math.round((cashTotal / totalAmt) * 10000) / 100,
    },
    {
      method: 'wechat',
      methodName: '微信支付',
      totalAmount: wechatTotal,
      orderCount: Math.floor(75 * multiplier),
      refundCount: Math.floor(Math.random() * 4),
      refundAmount: Math.round(wechatTotal * 0.02 * 100) / 100,
      netAmount: Math.round(wechatTotal * 0.98 * 100) / 100,
      percentage: Math.round((wechatTotal / totalAmt) * 10000) / 100,
    },
    {
      method: 'alipay',
      methodName: '支付宝',
      totalAmount: alipayTotal,
      orderCount: Math.floor(40 * multiplier),
      refundCount: Math.floor(Math.random() * 2),
      refundAmount: Math.round(alipayTotal * 0.012 * 100) / 100,
      netAmount: Math.round(alipayTotal * 0.988 * 100) / 100,
      percentage: Math.round((alipayTotal / totalAmt) * 10000) / 100,
    },
    {
      method: 'card',
      methodName: '银行卡',
      totalAmount: cardTotal,
      orderCount: Math.floor(5 * multiplier),
      refundCount: 0,
      refundAmount: 0,
      netAmount: cardTotal,
      percentage: Math.round((cardTotal / totalAmt) * 10000) / 100,
    },
    {
      method: 'other',
      methodName: '其他',
      totalAmount: otherTotal,
      orderCount: Math.floor(Math.random() * 2) + 1,
      refundCount: Math.floor(Math.random() * 2),
      refundAmount: Math.round(otherTotal * 0.05 * 100) / 100,
      netAmount: Math.round(otherTotal * 0.95 * 100) / 100,
      percentage: Math.round((otherTotal / totalAmt) * 10000) / 100,
    },
  ];

  const discrepancies: CashDiscrepancyRecord[] = daysAgo >= 1
    ? [
        {
          id: `disc-${dateStr}-001`,
          shiftId: `shift-${dateStr}-night`,
          type: Math.random() > 0.5 ? 'short' : 'over',
          amount: Math.round((Math.random() * 20 + 5) * 100) / 100,
          reportedBy: daysAgo % 2 === 0 ? '张伟' : '李明',
          reportedTime: '06:00',
          description: '日常收银差异登记',
          status: 'approved',
          reviewedBy: '王店长',
          reviewedTime: '09:00',
          reviewComment: '正常差异，确认通过',
        },
      ]
    : [];

  return {
    summary,
    paymentStats,
    discrepancies,
    expectedCashAmount: Math.round(cashTotal * 0.985 * 100) / 100,
    actualCashAmount: Math.round(cashTotal * 0.985 * (0.995 + Math.random() * 0.01) * 100) / 100,
  };
};

export const mockHistoricalReconciliations: Record<string, ReconciliationData> = {
  [getDateStr(0)]: mockReconciliationData,
  [getDateStr(1)]: createHistoricalReconciliation(1),
  [getDateStr(2)]: createHistoricalReconciliation(2),
  [getDateStr(3)]: createHistoricalReconciliation(3),
};
