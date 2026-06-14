import type { Product, ScheduleItem, Reminder, StockSnapshot, ShiftRevenue, PaymentMethod, Supplier, DeliveryAppointment, DeliveryItem, ProcessingTask, ProcessingStation, ProcessingStep, Employee, ShiftConfig, WorkArea, ShiftAssignment, AttendanceRecord, ScrapItem } from '../types';
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

const createProcessingSteps = (productType: string): ProcessingStep[] => {
  const stepTemplates: Record<string, ProcessingStep[]> = {
    rice_ball: [
      { id: 'step1', name: '备料', status: 'pending', estimatedDuration: 3 },
      { id: 'step2', name: '煮饭', status: 'pending', estimatedDuration: 15 },
      { id: 'step3', name: '配料', status: 'pending', estimatedDuration: 5 },
      { id: 'step4', name: '成型', status: 'pending', estimatedDuration: 3 },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 2 },
    ],
    sandwich: [
      { id: 'step1', name: '备料', status: 'pending', estimatedDuration: 2 },
      { id: 'step2', name: '烤面包', status: 'pending', estimatedDuration: 3 },
      { id: 'step3', name: '夹馅', status: 'pending', estimatedDuration: 4 },
      { id: 'step4', name: '切分', status: 'pending', estimatedDuration: 2 },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 2 },
    ],
    bento: [
      { id: 'step1', name: '备料', status: 'pending', estimatedDuration: 5 },
      { id: 'step2', name: '烹饪', status: 'pending', estimatedDuration: 20 },
      { id: 'step3', name: '分装', status: 'pending', estimatedDuration: 8 },
      { id: 'step4', name: '质检', status: 'pending', estimatedDuration: 3 },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 3 },
    ],
    dessert: [
      { id: 'step1', name: '备料', status: 'pending', estimatedDuration: 4 },
      { id: 'step2', name: '制作', status: 'pending', estimatedDuration: 15 },
      { id: 'step3', name: '冷藏', status: 'pending', estimatedDuration: 30 },
      { id: 'step4', name: '装饰', status: 'pending', estimatedDuration: 5 },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 3 },
    ],
  };
  return stepTemplates[productType] || stepTemplates.rice_ball;
};

export const mockProcessingStations: ProcessingStation[] = [
  { id: 'station1', name: '饭团加工台', type: 'rice', status: 'busy', efficiency: 0.95 },
  { id: 'station2', name: '三明治制作台', type: 'assembly', status: 'busy', efficiency: 0.9 },
  { id: 'station3', name: '便当烹饪区', type: 'filling', status: 'idle', efficiency: 0.88 },
  { id: 'station4', name: '包装质检台', type: 'packaging', status: 'idle', efficiency: 0.92 },
];

export const mockProcessingTasks: ProcessingTask[] = [
  {
    id: 'proc1',
    productId: '7',
    productName: '饭团-金枪鱼',
    category: 'rice_ball',
    quantity: 10,
    status: 'assembling',
    priority: 'high',
    scheduledTime: '22:00',
    estimatedDuration: 30,
    actualStartTime: '22:05',
    progress: 65,
    steps: [
      { id: 'step1', name: '备料', status: 'completed', startTime: '22:05', endTime: '22:08', estimatedDuration: 3 },
      { id: 'step2', name: '煮饭', status: 'completed', startTime: '22:08', endTime: '22:23', estimatedDuration: 15 },
      { id: 'step3', name: '配料', status: 'completed', startTime: '22:23', endTime: '22:28', estimatedDuration: 5 },
      { id: 'step4', name: '成型', status: 'in_progress', startTime: '22:28', estimatedDuration: 3, operator: '李师傅' },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 2 },
    ],
    operator: '李师傅',
    station: 'station1',
    isOverdue: false,
    overdueMinutes: 0,
    warningLevel: 'normal',
    orderSource: 'batch',
    temperatureCheck: { required: true, actualTemp: 65, targetTemp: 60, checkedAt: '22:23' },
  },
  {
    id: 'proc2',
    productId: '11',
    productName: '三明治-火腿蛋',
    category: 'sandwich',
    quantity: 8,
    status: 'cooking',
    priority: 'urgent',
    scheduledTime: '21:45',
    estimatedDuration: 15,
    actualStartTime: '21:50',
    progress: 40,
    steps: [
      { id: 'step1', name: '备料', status: 'completed', startTime: '21:50', endTime: '21:52', estimatedDuration: 2 },
      { id: 'step2', name: '烤面包', status: 'in_progress', startTime: '21:52', estimatedDuration: 3, operator: '王师傅' },
      { id: 'step3', name: '夹馅', status: 'pending', estimatedDuration: 4 },
      { id: 'step4', name: '切分', status: 'pending', estimatedDuration: 2 },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 2 },
    ],
    operator: '王师傅',
    station: 'station2',
    isOverdue: true,
    overdueMinutes: 18,
    warningLevel: 'critical',
    orderSource: 'online',
    orderId: 'ORD2026061400123',
  },
  {
    id: 'proc3',
    productId: '8',
    productName: '饭团-照烧鸡肉',
    category: 'rice_ball',
    quantity: 12,
    status: 'queued',
    priority: 'normal',
    scheduledTime: '23:00',
    estimatedDuration: 30,
    progress: 0,
    steps: createProcessingSteps('rice_ball'),
    station: 'station1',
    isOverdue: false,
    overdueMinutes: 0,
    warningLevel: 'normal',
    orderSource: 'batch',
  },
  {
    id: 'proc4',
    productId: '13',
    productName: '便当-红烧排骨',
    category: 'bento',
    quantity: 5,
    status: 'completed',
    priority: 'high',
    scheduledTime: '21:00',
    estimatedDuration: 45,
    actualStartTime: '21:02',
    actualEndTime: '21:48',
    progress: 100,
    steps: [
      { id: 'step1', name: '备料', status: 'completed', startTime: '21:02', endTime: '21:07', estimatedDuration: 5, operator: '张师傅' },
      { id: 'step2', name: '烹饪', status: 'completed', startTime: '21:07', endTime: '21:28', estimatedDuration: 20, operator: '张师傅' },
      { id: 'step3', name: '分装', status: 'completed', startTime: '21:28', endTime: '21:36', estimatedDuration: 8, operator: '张师傅' },
      { id: 'step4', name: '质检', status: 'completed', startTime: '21:36', endTime: '21:39', estimatedDuration: 3, operator: '李店长' },
      { id: 'step5', name: '包装', status: 'completed', startTime: '21:39', endTime: '21:42', estimatedDuration: 3, operator: '张师傅' },
    ],
    operator: '张师傅',
    station: 'station3',
    isOverdue: false,
    overdueMinutes: 0,
    warningLevel: 'normal',
    orderSource: 'in_store',
    qualityCheck: { required: true, passed: true, checkedAt: '21:39', checkedBy: '李店长' },
  },
  {
    id: 'proc5',
    productId: '9',
    productName: '饭团-梅干',
    category: 'rice_ball',
    quantity: 8,
    status: 'preparing',
    priority: 'normal',
    scheduledTime: '22:45',
    estimatedDuration: 28,
    actualStartTime: '22:50',
    progress: 15,
    steps: [
      { id: 'step1', name: '备料', status: 'in_progress', startTime: '22:50', estimatedDuration: 3, operator: '李师傅' },
      { id: 'step2', name: '煮饭', status: 'pending', estimatedDuration: 15 },
      { id: 'step3', name: '配料', status: 'pending', estimatedDuration: 5 },
      { id: 'step4', name: '成型', status: 'pending', estimatedDuration: 3 },
      { id: 'step5', name: '包装', status: 'pending', estimatedDuration: 2 },
    ],
    operator: '李师傅',
    station: 'station1',
    isOverdue: false,
    overdueMinutes: 0,
    warningLevel: 'normal',
    orderSource: 'batch',
  },
  {
    id: 'proc6',
    productId: '17',
    productName: '三明治-金枪鱼',
    category: 'sandwich',
    quantity: 6,
    status: 'packaging',
    priority: 'low',
    scheduledTime: '22:15',
    estimatedDuration: 13,
    actualStartTime: '22:20',
    progress: 85,
    steps: [
      { id: 'step1', name: '备料', status: 'completed', startTime: '22:20', endTime: '22:22', estimatedDuration: 2 },
      { id: 'step2', name: '烤面包', status: 'completed', startTime: '22:22', endTime: '22:25', estimatedDuration: 3 },
      { id: 'step3', name: '夹馅', status: 'completed', startTime: '22:25', endTime: '22:29', estimatedDuration: 4 },
      { id: 'step4', name: '切分', status: 'completed', startTime: '22:29', endTime: '22:31', estimatedDuration: 2 },
      { id: 'step5', name: '包装', status: 'in_progress', startTime: '22:31', estimatedDuration: 2, operator: '王师傅' },
    ],
    operator: '王师傅',
    station: 'station2',
    isOverdue: true,
    overdueMinutes: 8,
    warningLevel: 'warning',
    orderSource: 'batch',
  },
  {
    id: 'proc7',
    productId: '21',
    productName: '蛋糕-提拉米苏',
    category: 'dessert',
    quantity: 4,
    status: 'queued',
    priority: 'low',
    scheduledTime: '00:30',
    estimatedDuration: 60,
    progress: 0,
    steps: createProcessingSteps('dessert'),
    station: 'station3',
    isOverdue: false,
    overdueMinutes: 0,
    warningLevel: 'normal',
    orderSource: 'online',
    orderId: 'ORD2026061400156',
    notes: '需要冷藏30分钟',
  },
  {
    id: 'proc8',
    productId: '10',
    productName: '饭团-三文鱼',
    category: 'rice_ball',
    quantity: 15,
    status: 'queued',
    priority: 'normal',
    scheduledTime: '23:30',
    estimatedDuration: 35,
    progress: 0,
    steps: createProcessingSteps('rice_ball'),
    station: 'station1',
    isOverdue: false,
    overdueMinutes: 0,
    warningLevel: 'normal',
    orderSource: 'batch',
  },
];

export const mockEmployees: Employee[] = [
  { id: 'emp1', name: '张夜班', position: '店长', phone: '13800000001', status: 'active', avatarColor: 'bg-blue-500' },
  { id: 'emp2', name: '李师傅', position: '鲜食加工员', phone: '13800000002', status: 'active', avatarColor: 'bg-green-500' },
  { id: 'emp3', name: '王师傅', position: '补货员', phone: '13800000003', status: 'active', avatarColor: 'bg-orange-500' },
  { id: 'emp4', name: '赵收银', position: '收银员', phone: '13800000004', status: 'active', avatarColor: 'bg-purple-500' },
  { id: 'emp5', name: '刘理货', position: '理货员', phone: '13800000005', status: 'leave', avatarColor: 'bg-pink-500' },
  { id: 'emp6', name: '陈兼职', position: '兼职员工', phone: '13800000006', status: 'off', avatarColor: 'bg-teal-500' },
];

export const mockShiftConfigs: ShiftConfig[] = [
  { id: 'shift1', name: '早班', startTime: '06:00', endTime: '14:00', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', isCrossDay: false, requiredStaff: 2 },
  { id: 'shift2', name: '中班', startTime: '14:00', endTime: '22:00', color: 'bg-blue-100 text-blue-800 border-blue-300', isCrossDay: false, requiredStaff: 2 },
  { id: 'shift3', name: '夜班', startTime: '22:00', endTime: '06:00', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', isCrossDay: true, requiredStaff: 2 },
  { id: 'shift4', name: '通宵班', startTime: '00:00', endTime: '08:00', color: 'bg-purple-100 text-purple-800 border-purple-300', isCrossDay: false, requiredStaff: 1 },
];

export const mockWorkAreas: WorkArea[] = [
  { id: 'area1', name: '收银区', description: '收银、顾客服务', icon: 'receipt' },
  { id: 'area2', name: '鲜食加工区', description: '饭团、便当制作', icon: 'chef' },
  { id: 'area3', name: '补货理货区', description: '商品上架、补货', icon: 'package' },
  { id: 'area4', name: '仓储区', description: '库存管理、收货', icon: 'warehouse' },
  { id: 'area5', name: '保洁区', description: '清洁、整理', icon: 'sparkles' },
];

const getAttendanceDate = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return formatDate(date);
};

export const mockShiftAssignments: ShiftAssignment[] = [
  { id: 'assign1', employeeId: 'emp1', shiftId: 'shift3', areaId: 'area1', date: getAttendanceDate(0), notes: '店长值班' },
  { id: 'assign2', employeeId: 'emp2', shiftId: 'shift3', areaId: 'area2', date: getAttendanceDate(0) },
  { id: 'assign3', employeeId: 'emp3', shiftId: 'shift3', areaId: 'area3', date: getAttendanceDate(0) },
  { id: 'assign4', employeeId: 'emp4', shiftId: 'shift2', areaId: 'area1', date: getAttendanceDate(0) },
  { id: 'assign5', employeeId: 'emp1', shiftId: 'shift3', areaId: 'area1', date: getAttendanceDate(-1) },
  { id: 'assign6', employeeId: 'emp2', shiftId: 'shift3', areaId: 'area2', date: getAttendanceDate(-1) },
  { id: 'assign7', employeeId: 'emp3', shiftId: 'shift3', areaId: 'area3', date: getAttendanceDate(-1) },
  { id: 'assign8', employeeId: 'emp4', shiftId: 'shift2', areaId: 'area1', date: getAttendanceDate(-1) },
  { id: 'assign9', employeeId: 'emp5', shiftId: 'shift1', areaId: 'area3', date: getAttendanceDate(-1) },
  { id: 'assign10', employeeId: 'emp1', shiftId: 'shift3', areaId: 'area1', date: getAttendanceDate(-2) },
  { id: 'assign11', employeeId: 'emp2', shiftId: 'shift3', areaId: 'area2', date: getAttendanceDate(-2) },
  { id: 'assign12', employeeId: 'emp3', shiftId: 'shift3', areaId: 'area3', date: getAttendanceDate(-2) },
  { id: 'assign13', employeeId: 'emp4', shiftId: 'shift2', areaId: 'area1', date: getAttendanceDate(-2) },
  { id: 'assign14', employeeId: 'emp6', shiftId: 'shift1', areaId: 'area4', date: getAttendanceDate(-2) },
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  { id: 'att1', employeeId: 'emp1', assignmentId: 'assign5', date: getAttendanceDate(-1), checkInTime: '21:50', checkOutTime: '06:05', status: 'checked_out', actualWorkMinutes: 495, lateMinutes: 0, earlyLeaveMinutes: 0, notes: '准时上下班' },
  { id: 'att2', employeeId: 'emp2', assignmentId: 'assign6', date: getAttendanceDate(-1), checkInTime: '22:15', checkOutTime: '06:10', status: 'late', actualWorkMinutes: 475, lateMinutes: 15, earlyLeaveMinutes: 0, notes: '迟到15分钟' },
  { id: 'att3', employeeId: 'emp3', assignmentId: 'assign7', date: getAttendanceDate(-1), checkInTime: '21:55', checkOutTime: '05:50', status: 'early_leave', actualWorkMinutes: 475, lateMinutes: 0, earlyLeaveMinutes: 10, notes: '提前10分钟下班' },
  { id: 'att4', employeeId: 'emp4', assignmentId: 'assign8', date: getAttendanceDate(-1), checkInTime: '13:55', checkOutTime: '22:00', status: 'checked_out', actualWorkMinutes: 485, lateMinutes: 0, earlyLeaveMinutes: 0 },
  { id: 'att5', employeeId: 'emp5', assignmentId: 'assign9', date: getAttendanceDate(-1), status: 'on_leave', actualWorkMinutes: 0, lateMinutes: 0, earlyLeaveMinutes: 0, notes: '请假一天' },
  { id: 'att6', employeeId: 'emp1', assignmentId: 'assign10', date: getAttendanceDate(-2), checkInTime: '21:58', checkOutTime: '06:02', status: 'checked_out', actualWorkMinutes: 484, lateMinutes: 0, earlyLeaveMinutes: 0 },
  { id: 'att7', employeeId: 'emp2', assignmentId: 'assign11', date: getAttendanceDate(-2), checkInTime: '22:00', checkOutTime: '06:00', status: 'checked_out', actualWorkMinutes: 480, lateMinutes: 0, earlyLeaveMinutes: 0 },
  { id: 'att8', employeeId: 'emp3', assignmentId: 'assign12', date: getAttendanceDate(-2), checkInTime: '22:05', checkOutTime: '06:00', status: 'late', actualWorkMinutes: 475, lateMinutes: 5, earlyLeaveMinutes: 0 },
  { id: 'att9', employeeId: 'emp4', assignmentId: 'assign13', date: getAttendanceDate(-2), checkInTime: '14:00', checkOutTime: '21:45', status: 'early_leave', actualWorkMinutes: 465, lateMinutes: 0, earlyLeaveMinutes: 15 },
  { id: 'att10', employeeId: 'emp6', assignmentId: 'assign14', date: getAttendanceDate(-2), checkInTime: '06:00', checkOutTime: '14:00', status: 'checked_out', actualWorkMinutes: 480, lateMinutes: 0, earlyLeaveMinutes: 0 },
];

const getScrapMonth = (monthsOffset: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const mockScrapItems: ScrapItem[] = [
  {
    id: 'scrap1',
    productId: '11',
    productName: '三明治-火腿蛋',
    category: 'rice_ball',
    reason: 'near_expiry',
    quantity: 3,
    unitPrice: 12.0,
    totalLoss: 36.0,
    shelfLocation: 'B2-01',
    expirationDate: '2026-06-14',
    registeredBy: '张夜班',
    registeredTime: '22:15',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '22:30',
    reviewComment: '确认临期，同意下架报废',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '23:00',
    notes: '保质期最后一天，无法继续销售',
    month: getScrapMonth(0),
  },
  {
    id: 'scrap2',
    productId: '13',
    productName: '便当-红烧排骨',
    category: 'rice_ball',
    reason: 'expired',
    quantity: 2,
    unitPrice: 18.0,
    totalLoss: 36.0,
    shelfLocation: 'B4-01',
    expirationDate: '2026-06-13',
    registeredBy: '张夜班',
    registeredTime: '21:30',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '21:45',
    reviewComment: '已过期，必须报废处理',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '22:00',
    notes: '已过期1天，不可食用',
    month: getScrapMonth(0),
  },
  {
    id: 'scrap3',
    productId: '15',
    productName: '酸奶-原味',
    category: 'beverage',
    reason: 'expired',
    quantity: 3,
    unitPrice: 5.0,
    totalLoss: 15.0,
    shelfLocation: 'C1-01',
    expirationDate: '2026-06-13',
    registeredBy: '李师傅',
    registeredTime: '22:00',
    reviewStatus: 'pending',
    confirmationStatus: 'unconfirmed',
    month: getScrapMonth(0),
  },
  {
    id: 'scrap4',
    productId: '7',
    productName: '饭团-金枪鱼',
    category: 'rice_ball',
    reason: 'damaged',
    quantity: 1,
    unitPrice: 8.5,
    totalLoss: 8.5,
    shelfLocation: 'B1-01',
    registeredBy: '王师傅',
    registeredTime: '23:10',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '23:25',
    reviewComment: '包装破损严重，同意报废',
    confirmationStatus: 'unconfirmed',
    month: getScrapMonth(0),
    notes: '运输途中包装变形，无法上架',
  },
  {
    id: 'scrap5',
    productId: '9',
    productName: '饭团-梅干',
    category: 'rice_ball',
    reason: 'quality_issue',
    quantity: 2,
    unitPrice: 7.5,
    totalLoss: 15.0,
    shelfLocation: 'B1-03',
    registeredBy: '李师傅',
    registeredTime: '00:30',
    reviewStatus: 'pending',
    confirmationStatus: 'unconfirmed',
    month: getScrapMonth(0),
    notes: '口感异常，疑似存放温度不当',
  },
  {
    id: 'scrap6',
    productId: '19',
    productName: '酸奶-草莓味',
    category: 'beverage',
    reason: 'near_expiry',
    quantity: 5,
    unitPrice: 5.5,
    totalLoss: 27.5,
    shelfLocation: 'C1-03',
    expirationDate: '2026-06-18',
    registeredBy: '张夜班',
    registeredTime: '01:00',
    reviewStatus: 'rejected',
    reviewedBy: '李店长',
    reviewedTime: '01:15',
    reviewComment: '距离过期还有4天，建议促销而非报废',
    confirmationStatus: 'unconfirmed',
    month: getScrapMonth(0),
    notes: '仍有销售时间，改为促销处理',
  },
  {
    id: 'scrap7',
    productId: '1',
    productName: '可口可乐 500ml',
    category: 'beverage',
    reason: 'damaged',
    quantity: 4,
    unitPrice: 3.5,
    totalLoss: 14.0,
    shelfLocation: 'A1-01',
    registeredBy: '赵收银',
    registeredTime: '23:45',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '00:10',
    reviewComment: '罐体凹陷，同意报废',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '00:30',
    month: getScrapMonth(-1),
  },
  {
    id: 'scrap8',
    productId: '14',
    productName: '便当-宫保鸡丁',
    category: 'rice_ball',
    reason: 'expired',
    quantity: 3,
    unitPrice: 16.0,
    totalLoss: 48.0,
    shelfLocation: 'B4-02',
    expirationDate: '2026-05-15',
    registeredBy: '张夜班',
    registeredTime: '22:00',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '22:15',
    reviewComment: '确认过期，同意报废',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '22:30',
    month: getScrapMonth(-1),
  },
  {
    id: 'scrap9',
    productId: '17',
    productName: '三明治-金枪鱼',
    category: 'rice_ball',
    reason: 'near_expiry',
    quantity: 2,
    unitPrice: 13.0,
    totalLoss: 26.0,
    shelfLocation: 'B2-02',
    expirationDate: '2026-05-13',
    registeredBy: '李师傅',
    registeredTime: '21:30',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '21:50',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '22:00',
    month: getScrapMonth(-1),
  },
  {
    id: 'scrap10',
    productId: '21',
    productName: '蛋糕-提拉米苏',
    category: 'rice_ball',
    reason: 'quality_issue',
    quantity: 1,
    unitPrice: 15.0,
    totalLoss: 15.0,
    shelfLocation: 'B5-02',
    registeredBy: '王师傅',
    registeredTime: '00:15',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '00:30',
    reviewComment: '外观异常，同意报废',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '01:00',
    month: getScrapMonth(-1),
    notes: '冷藏温度异常导致变质',
  },
  {
    id: 'scrap11',
    productId: '8',
    productName: '饭团-照烧鸡肉',
    category: 'rice_ball',
    reason: 'other',
    quantity: 2,
    unitPrice: 8.0,
    totalLoss: 16.0,
    shelfLocation: 'B1-02',
    registeredBy: '张夜班',
    registeredTime: '23:30',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '23:50',
    reviewComment: '顾客退回，同意报废',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '00:10',
    month: getScrapMonth(-2),
  },
  {
    id: 'scrap12',
    productId: '16',
    productName: '牛奶-纯牛奶',
    category: 'beverage',
    reason: 'damaged',
    quantity: 6,
    unitPrice: 6.5,
    totalLoss: 39.0,
    shelfLocation: 'C1-02',
    registeredBy: '赵收银',
    registeredTime: '01:20',
    reviewStatus: 'approved',
    reviewedBy: '李店长',
    reviewedTime: '01:40',
    reviewComment: '包装泄漏，同意报废',
    confirmationStatus: 'confirmed',
    confirmedBy: '张夜班',
    confirmedTime: '02:00',
    month: getScrapMonth(-2),
  },
];
