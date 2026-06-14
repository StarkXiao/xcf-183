import type { Product, ScheduleItem, Reminder, StockSnapshot, ShiftRevenue, PaymentMethod, Supplier, DeliveryAppointment, DeliveryItem } from '../types';
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

export const mockSuppliers: Supplier[] = [
  { id: 'sup1', name: '可口可乐饮料有限公司', contactPerson: '王经理', phone: '13800138001', category: '饮料' },
  { id: 'sup2', name: '康师傅食品有限公司', contactPerson: '李主管', phone: '13800138002', category: '方便食品' },
  { id: 'sup3', name: '蒙牛乳业有限公司', contactPerson: '张经理', phone: '13800138003', category: '乳制品' },
  { id: 'sup4', name: '益海嘉里食品有限公司', contactPerson: '刘经理', phone: '13800138004', category: '粮油' },
  { id: 'sup5', name: '旺旺食品有限公司', contactPerson: '陈主管', phone: '13800138005', category: '休闲食品' },
];

const createDeliveryItems = (items: { productId: string; productName: string; expectedQuantity: number; unit: string; price: number }[]): DeliveryItem[] => {
  return items.map(item => ({
    ...item,
    actualQuantity: item.expectedQuantity,
    checked: false,
  }));
};

const getDeliveryDate = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDate(date);
};

export const mockDeliveries: DeliveryAppointment[] = [
  {
    id: 'del1',
    deliveryNo: 'DLV20260614001',
    supplierId: 'sup1',
    supplierName: '可口可乐饮料有限公司',
    contactPerson: '王经理',
    contactPhone: '13800138001',
    scheduledDate: getDeliveryDate(0),
    scheduledTime: '21:00',
    estimatedArrivalTime: '21:15',
    actualArrivalTime: '21:12',
    status: 'completed',
    items: createDeliveryItems([
      { productId: '1', productName: '可口可乐 500ml', expectedQuantity: 30, unit: '瓶', price: 2.5 },
      { productId: '2', productName: '百事可乐 500ml', expectedQuantity: 25, unit: '瓶', price: 2.5 },
      { productId: '5', productName: '红牛 250ml', expectedQuantity: 20, unit: '罐', price: 4.5 },
    ]),
    totalAmount: 227.5,
    remarks: '夜间送货，请走后门',
    registeredBy: '张夜班',
    registeredTime: '20:30',
    verifiedBy: '张夜班',
    verifiedTime: '21:45',
    discrepancies: [],
    licensePlate: '京A12345',
    driverName: '赵师傅',
    temperature: '4℃',
    qrCode: 'DLV20260614001-COKE',
  },
  {
    id: 'del2',
    deliveryNo: 'DLV20260614002',
    supplierId: 'sup3',
    supplierName: '蒙牛乳业有限公司',
    contactPerson: '张经理',
    contactPhone: '13800138003',
    scheduledDate: getDeliveryDate(0),
    scheduledTime: '22:30',
    estimatedArrivalTime: '22:40',
    actualArrivalTime: undefined,
    status: 'registered',
    items: createDeliveryItems([
      { productId: '15', productName: '酸奶-原味', expectedQuantity: 25, unit: '盒', price: 3.8 },
      { productId: '16', productName: '牛奶-纯牛奶', expectedQuantity: 30, unit: '盒', price: 4.8 },
      { productId: '19', productName: '酸奶-草莓味', expectedQuantity: 20, unit: '盒', price: 4.2 },
    ]),
    totalAmount: 323.0,
    remarks: '冷链运输，注意保温',
    registeredBy: '张夜班',
    registeredTime: '21:00',
    verifiedBy: undefined,
    verifiedTime: undefined,
    discrepancies: [],
    licensePlate: '京B67890',
    driverName: '刘师傅',
    temperature: '2-6℃',
    qrCode: 'DLV20260614002-MENGNIU',
  },
  {
    id: 'del3',
    deliveryNo: 'DLV20260614003',
    supplierId: 'sup2',
    supplierName: '康师傅食品有限公司',
    contactPerson: '李主管',
    contactPhone: '13800138002',
    scheduledDate: getDeliveryDate(0),
    scheduledTime: '23:30',
    estimatedArrivalTime: '23:20',
    actualArrivalTime: '23:18',
    status: 'verifying',
    items: createDeliveryItems([
      { productId: '7', productName: '饭团-金枪鱼', expectedQuantity: 15, unit: '个', price: 6.0 },
      { productId: '8', productName: '饭团-照烧鸡肉', expectedQuantity: 15, unit: '个', price: 5.5 },
      { productId: '11', productName: '三明治-火腿蛋', expectedQuantity: 10, unit: '个', price: 8.5 },
      { productId: '12', productName: '关东煮-萝卜', expectedQuantity: 30, unit: '串', price: 2.0 },
    ]),
    totalAmount: 335.0,
    remarks: '请检查生产日期',
    registeredBy: '张夜班',
    registeredTime: '22:00',
    verifiedBy: undefined,
    verifiedTime: undefined,
    discrepancies: [],
    licensePlate: '京C11111',
    driverName: '王师傅',
    temperature: undefined,
    qrCode: 'DLV20260614003-KANGSHIFU',
  },
  {
    id: 'del4',
    deliveryNo: 'DLV20260615001',
    supplierId: 'sup5',
    supplierName: '旺旺食品有限公司',
    contactPerson: '陈主管',
    contactPhone: '13800138005',
    scheduledDate: getDeliveryDate(1),
    scheduledTime: '00:30',
    estimatedArrivalTime: '00:25',
    actualArrivalTime: undefined,
    status: 'registered',
    items: createDeliveryItems([
      { productId: '20', productName: '面包-全麦', expectedQuantity: 25, unit: '个', price: 5.5 },
      { productId: '21', productName: '蛋糕-提拉米苏', expectedQuantity: 10, unit: '个', price: 10.5 },
    ]),
    totalAmount: 242.5,
    remarks: '提前电话联系',
    registeredBy: '张夜班',
    registeredTime: '22:30',
    verifiedBy: undefined,
    verifiedTime: undefined,
    discrepancies: [],
    licensePlate: undefined,
    driverName: undefined,
    temperature: undefined,
    qrCode: 'DLV20260615001-WANGWANG',
  },
  {
    id: 'del5',
    deliveryNo: 'DLV20260613001',
    supplierId: 'sup4',
    supplierName: '益海嘉里食品有限公司',
    contactPerson: '刘经理',
    contactPhone: '13800138004',
    scheduledDate: getDeliveryDate(-1),
    scheduledTime: '22:00',
    estimatedArrivalTime: '22:10',
    actualArrivalTime: '22:15',
    status: 'discrepancy',
    items: [
      { productId: '1', productName: '可口可乐 500ml', expectedQuantity: 30, actualQuantity: 28, unit: '瓶', price: 2.5, checked: true },
      { productId: '3', productName: '农夫山泉 550ml', expectedQuantity: 40, actualQuantity: 40, unit: '瓶', price: 1.2, checked: true },
      { productId: '4', productName: '怡宝矿泉水 555ml', expectedQuantity: 35, actualQuantity: 35, unit: '瓶', price: 1.0, checked: true },
    ],
    totalAmount: 154.0,
    remarks: '有短少，已拍照上报',
    registeredBy: '张夜班',
    registeredTime: '21:00',
    verifiedBy: '张夜班',
    verifiedTime: '22:45',
    discrepancies: [
      {
        id: 'disc-del5-1',
        deliveryId: 'del5',
        productId: '1',
        productName: '可口可乐 500ml',
        type: 'short',
        expectedQuantity: 30,
        actualQuantity: 28,
        difference: -2,
        description: '送货单显示30瓶，实际清点只有28瓶，少2瓶',
        photos: ['photo1.jpg', 'photo2.jpg'],
        reportedTime: '22:30',
        reportedBy: '张夜班',
        status: 'resolved',
        resolution: '供应商确认短少，下次补货时补齐',
        resolvedTime: '23:00',
      },
    ],
    licensePlate: '京D22222',
    driverName: '孙师傅',
    temperature: undefined,
    qrCode: 'DLV20260613001-YIHAI',
  },
];

export const DELIVERY_TIME_SLOTS = [
  '20:00-21:00',
  '21:00-22:00',
  '22:00-23:00',
  '23:00-00:00',
  '00:00-01:00',
  '01:00-02:00',
  '02:00-03:00',
  '03:00-04:00',
  '04:00-05:00',
  '05:00-06:00',
];

export const DISCREPANCY_TYPES = [
  { value: 'short', label: '数量短少', color: 'text-red-600 bg-red-50' },
  { value: 'over', label: '数量超出', color: 'text-orange-600 bg-orange-50' },
  { value: 'damaged', label: '商品破损', color: 'text-red-600 bg-red-50' },
  { value: 'expired', label: '商品过期', color: 'text-red-600 bg-red-50' },
  { value: 'wrong_item', label: '货不对板', color: 'text-yellow-600 bg-yellow-50' },
];
