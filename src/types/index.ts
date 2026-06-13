export interface Product {
  id: string;
  name: string;
  category: 'beverage' | 'rice_ball' | 'expiring';
  stock: number;
  maxStock: number;
  price: number;
  expirationDate?: string;
  shelfLocation: string;
}

export interface ScheduleItem {
  id: string;
  productId: string;
  productName: string;
  time: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Reminder {
  id: string;
  productId: string;
  productName: string;
  message: string;
  time: string;
  type: 'low_stock' | 'expiring' | 'scheduled';
}

export interface Statistics {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  expiringCount: number;
  scheduledTasks: number;
  completedTasks: number;
}
