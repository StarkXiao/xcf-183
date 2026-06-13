import type { Product, ScheduleItem, Reminder } from '../types';

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
  { id: '14', name: '便当-宫保鸡丁', category: 'rice_ball', stock: 5, maxStock: 8, price: 16.0, shelfLocation: 'B4-02', expirationDate: '2026-06-14' },
  { id: '15', name: '酸奶-原味', category: 'beverage', stock: 3, maxStock: 20, price: 5.0, shelfLocation: 'C1-01', expirationDate: '2026-06-13' },
  { id: '16', name: '牛奶-纯牛奶', category: 'beverage', stock: 10, maxStock: 25, price: 6.5, shelfLocation: 'C1-02', expirationDate: '2026-06-15' },
];

export const mockSchedule: ScheduleItem[] = [
  { id: 's1', productId: '4', productName: '怡宝矿泉水 555ml', time: '22:00', quantity: 20, status: 'pending' },
  { id: 's2', productId: '2', productName: '百事可乐 500ml', time: '22:30', quantity: 15, status: 'pending' },
  { id: 's3', productId: '7', productName: '饭团-金枪鱼', time: '23:00', quantity: 10, status: 'in_progress' },
  { id: 's4', productId: '11', productName: '三明治-火腿蛋', time: '23:30', quantity: 8, status: 'pending' },
  { id: 's5', productId: '13', productName: '便当-红烧排骨', time: '00:00', quantity: 5, status: 'completed' },
  { id: 's6', productId: '15', productName: '酸奶-原味', time: '00:30', quantity: 15, status: 'pending' },
  { id: 's7', productId: '9', productName: '饭团-梅干', time: '01:00', quantity: 8, status: 'pending' },
  { id: 's8', productId: '5', productName: '红牛 250ml', time: '01:30', quantity: 10, status: 'pending' },
];

export const mockReminders: Reminder[] = [
  { id: 'r1', productId: '4', productName: '怡宝矿泉水 555ml', message: '库存不足，当前库存: 5', time: '22:00', type: 'low_stock' },
  { id: 'r2', productId: '15', productName: '酸奶-原味', message: '即将过期，有效期至: 2026-06-13', time: '22:00', type: 'expiring' },
  { id: 'r3', productId: '13', productName: '便当-红烧排骨', message: '即将过期，有效期至: 2026-06-13', time: '22:00', type: 'expiring' },
  { id: 'r4', productId: '7', productName: '饭团-金枪鱼', message: '补货任务已开始', time: '23:00', type: 'scheduled' },
];
