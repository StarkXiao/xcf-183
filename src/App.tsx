import { useState, useMemo, useEffect, useCallback } from 'react';
import { Store, Bell, BellOff } from 'lucide-react';
import ProductPanel from './components/ProductPanel';
import ScheduleTimeline from './components/ScheduleTimeline';
import StockCalculator from './components/StockCalculator';
import ReminderModal from './components/ReminderModal';
import StatisticsSummary from './components/StatisticsSummary';
import type { Product, ScheduleItem, Reminder, Statistics } from './types';
import { mockProducts, mockSchedule, mockReminders } from './data/mockData';
import {
  getCurrentTime,
  checkOverdueTasks,
  recalculateSchedule,
  generateOverdueReminders,
  calculateTotalEstimatedFinishTime,
} from './utils/scheduleUtils';
import { getExpiryStatistics } from './utils/expiryUtils';

export default function App() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockSchedule);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReminders, setShowReminders] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTime());

  const checkAndUpdateSchedule = useCallback(() => {
    const now = getCurrentTime();
    setCurrentTime(now);

    setSchedule(prevSchedule => {
      let updatedSchedule = checkOverdueTasks(prevSchedule, now);
      updatedSchedule = recalculateSchedule(updatedSchedule, now);
      
      const result = generateOverdueReminders(updatedSchedule, reminders, now);
      if (result.reminders.length !== reminders.length) {
        setReminders(result.reminders);
      }
      
      return result.updatedSchedule;
    });
  }, [reminders]);

  useEffect(() => {
    checkAndUpdateSchedule();
    const interval = setInterval(checkAndUpdateSchedule, 30000);
    return () => clearInterval(interval);
  }, [checkAndUpdateSchedule]);

  const statistics = useMemo<Statistics>(() => {
    const lowStockCount = products.filter(p => p.stock < p.maxStock * 0.3).length;
    const expiryStats = getExpiryStatistics(products);
    const completedTasks = schedule.filter(s => s.status === 'completed').length;
    const overdueTasks = schedule.filter(s => s.isOverdue && s.status === 'pending').length;
    const estimatedFinishTime = calculateTotalEstimatedFinishTime(schedule, currentTime);

    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      lowStockCount,
      expiringCount: expiryStats.total,
      expiringCritical: expiryStats.critical,
      expiringWarning: expiryStats.warning,
      expiringAttention: expiryStats.attention,
      scheduledTasks: schedule.length,
      completedTasks,
      overdueTasks,
      estimatedFinishTime,
    };
  }, [products, schedule, currentTime]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleScheduleStatusChange = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    const now = getCurrentTime();
    setSchedule(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        
        const updates: Partial<ScheduleItem> = { status };
        
        if (status === 'in_progress' && !item.actualStartTime) {
          updates.actualStartTime = now;
          updates.isOverdue = false;
        }
        
        if (status === 'completed' && !item.actualEndTime) {
          updates.actualEndTime = now;
          updates.isOverdue = false;
        }
        
        if (status === 'pending') {
          updates.actualStartTime = undefined;
          updates.actualEndTime = undefined;
          updates.reminderSent = false;
        }
        
        return { ...item, ...updates };
      });
      
      return recalculateSchedule(updated, now);
    });
    
    setReminders(prev => prev.filter(r => r.scheduleId !== id || r.type !== 'overdue'));
  };

  const handleDismissReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleStockUpdate = (productId: string, amount: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, stock: Math.min(product.stock + amount, product.maxStock) }
        : product
    ));

    setSchedule(prev => prev.map(item => 
      item.productId === productId && item.status !== 'completed'
        ? { ...item, status: 'completed' as const }
        : item
    ));

    const updatedProduct = products.find(p => p.id === productId);
    if (updatedProduct) {
      const newStock = Math.min(updatedProduct.stock + amount, updatedProduct.maxStock);
      setSelectedProduct({ ...updatedProduct, stock: newStock });
    }
  };

  const toggleReminders = () => {
    setShowReminders(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">夜班便利店补货排程器</h1>
                <p className="text-sm text-gray-500">Night Shift Convenience Store Replenishment Scheduler</p>
              </div>
            </div>
            <button
              onClick={toggleReminders}
              className={`relative p-2 rounded-lg transition-colors ${
                showReminders ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {showReminders ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              {showReminders && reminders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {reminders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ProductPanel 
              products={products} 
              onProductSelect={handleProductSelect}
              selectedProductId={selectedProduct?.id ?? null}
            />
          </div>

          <div className="lg:col-span-5">
            <ScheduleTimeline 
              schedule={schedule} 
              onStatusChange={handleScheduleStatusChange}
              selectedProductId={selectedProduct?.id ?? null}
            />
          </div>

          <div className="lg:col-span-3">
            <StockCalculator 
              products={products} 
              selectedProduct={selectedProduct} 
              onReplenish={handleStockUpdate}
            />
          </div>
        </div>

        <div className="mt-6">
          <StatisticsSummary statistics={statistics} products={products} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 夜班便利店补货排程器 | 为夜班员工提供高效补货管理
          </p>
        </div>
      </footer>

      {showReminders && <ReminderModal reminders={reminders} onDismiss={handleDismissReminder} />}
    </div>
  );
}
