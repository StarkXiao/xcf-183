import type { Product, ScheduleItem, Reminder, StockSnapshot, HistoryRecord } from '../types';

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getDateRange = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date));
  }
  return dates;
};

export const formatDisplayDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`;
};

export const createSnapshot = (
  date: string,
  products: Product[],
  schedule: ScheduleItem[],
  reminders: Reminder[]
): StockSnapshot => {
  return {
    date,
    products: JSON.parse(JSON.stringify(products)),
    schedule: JSON.parse(JSON.stringify(schedule)),
    reminders: JSON.parse(JSON.stringify(reminders)),
    snapshotTime: new Date().toISOString(),
  };
};

export const calculateHistoryStats = (
  schedule: ScheduleItem[],
  products: Product[]
): HistoryRecord => {
  const completedTasks = schedule.filter(s => s.status === 'completed').length;
  const totalTasks = schedule.length;
  const totalReplenished = schedule
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.quantity, 0);
  const lowStockAtEnd = products.filter(p => p.stock < p.maxStock * 0.3).length;

  return {
    date: '',
    completedTasks,
    totalTasks,
    totalReplenished,
    lowStockAtEnd,
  };
};

const STORAGE_KEY = 'replenishment_history_snapshots';

export const saveSnapshot = (snapshot: StockSnapshot): void => {
  try {
    const existing = loadAllSnapshots();
    const filtered = existing.filter(s => s.date !== snapshot.date);
    filtered.push(snapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save snapshot:', e);
  }
};

export const loadAllSnapshots = (): StockSnapshot[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load snapshots:', e);
    return [];
  }
};

export const loadSnapshotByDate = (date: string): StockSnapshot | null => {
  const snapshots = loadAllSnapshots();
  return snapshots.find(s => s.date === date) || null;
};
