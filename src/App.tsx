import { useState, useMemo } from 'react';
import { Store, Bell, BellOff } from 'lucide-react';
import ProductPanel from './components/ProductPanel';
import ScheduleTimeline from './components/ScheduleTimeline';
import StockCalculator from './components/StockCalculator';
import ReminderModal from './components/ReminderModal';
import StatisticsSummary from './components/StatisticsSummary';
import type { Product, ScheduleItem, Reminder, Statistics } from './types';
import { mockProducts, mockSchedule, mockReminders } from './data/mockData';

export default function App() {
  const [products] = useState<Product[]>(mockProducts);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockSchedule);
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReminders, setShowReminders] = useState(true);

  const statistics = useMemo<Statistics>(() => {
    const lowStockCount = products.filter(p => p.stock < p.maxStock * 0.3).length;
    const expiringCount = products.filter(p => p.expirationDate && new Date(p.expirationDate) <= new Date()).length;
    const completedTasks = schedule.filter(s => s.status === 'completed').length;

    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      lowStockCount,
      expiringCount,
      scheduledTasks: schedule.length,
      completedTasks,
    };
  }, [products, schedule]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleScheduleStatusChange = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    setSchedule(prev => prev.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };

  const handleDismissReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
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
            <ProductPanel products={products} onProductSelect={handleProductSelect} />
          </div>

          <div className="lg:col-span-5">
            <ScheduleTimeline schedule={schedule} onStatusChange={handleScheduleStatusChange} />
          </div>

          <div className="lg:col-span-3">
            <StockCalculator 
              products={products} 
              selectedProduct={selectedProduct} 
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
