import { useState, useMemo, useEffect, useCallback } from 'react';
import { Store, Bell, BellOff, Clock, ListTodo, Receipt, Truck, ChefHat, Flame, Users, Trash2 } from 'lucide-react';
import ProductPanel from './components/ProductPanel';
import ScheduleTimeline from './components/ScheduleTimeline';
import StockCalculator from './components/StockCalculator';
import ReminderModal from './components/ReminderModal';
import StatisticsSummary from './components/StatisticsSummary';
import HistoryTimeline from './components/HistoryTimeline';
import NightReconciliation from './components/NightReconciliation';
import SupplierDeliveryBoard from './components/SupplierDeliveryBoard';
import DeliveryRegistrationModal from './components/DeliveryRegistrationModal';
import ScanVerificationModal from './components/ScanVerificationModal';
import DiscrepancyReportModal from './components/DiscrepancyReportModal';
import ProcessingBoard from './components/ProcessingBoard';
import ShelfHeatmap from './components/ShelfHeatmap';
import EmployeeAttendance from './components/EmployeeAttendance';
import ScrapManagement from './components/ScrapManagement';
import type { Product, ScheduleItem, Reminder, Statistics, StockSnapshot, ShiftRevenue, DeliveryAppointment, Supplier, DeliveryItem, DeliveryDiscrepancy, ProcessingTask, ProcessingStation, ProcessingStep, Employee, ShiftConfig, WorkArea, ShiftAssignment, AttendanceRecord, ScrapItem } from './types';
import { mockProducts, mockSchedule, mockReminders, mockHistoricalSnapshots, mockShiftRevenues, mockSuppliers, mockDeliveries, mockProcessingTasks, mockProcessingStations, mockEmployees, mockShiftConfigs, mockWorkAreas, mockShiftAssignments, mockAttendanceRecords, mockScrapItems } from './data/mockData';
import {
  getCurrentTime,
  checkOverdueTasks,
  recalculateSchedule,
  generateOverdueReminders,
  calculateTotalEstimatedFinishTime,
  checkTaskDependencies,
  isTaskBlocked,
} from './utils/scheduleUtils';
import { getExpiryStatistics, generateExpiryReminders, isExpiringProduct } from './utils/expiryUtils';
import { formatDate, createSnapshot, saveSnapshot, loadAllSnapshots } from './utils/historyUtils';
import {
  getDeliveryNo,
  generateQRCode,
  updateDeliveryStatus,
  addDeliveryDiscrepancy,
} from './utils/deliveryUtils';
import {
  checkProcessingOverdue,
  generateProcessingReminders,
  sortProcessingTasks,
  calculateProcessingStatistics,
  advanceTaskStatus,
  updateStepStatus,
} from './utils/processingUtils';
import { generateShelfHeatmapData } from './utils/shelfHeatmapUtils';

export default function App() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockSchedule);
  const [reminders, setReminders] = useState<Reminder[]>(() => 
    generateExpiryReminders(mockProducts, mockReminders)
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReminders, setShowReminders] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTime());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [snapshots, setSnapshots] = useState<StockSnapshot[]>(() => {
    const stored = loadAllSnapshots();
    if (stored.length === 0) return mockHistoricalSnapshots;
    const existingDates = new Set(mockHistoricalSnapshots.map(s => s.date));
    const newOnes = stored.filter(s => !existingDates.has(s.date));
    return [...mockHistoricalSnapshots, ...newOnes];
  });
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'replenishment' | 'reconciliation' | 'delivery' | 'processing' | 'heatmap' | 'attendance' | 'scrap'>('replenishment');
  const [shiftRevenues, setShiftRevenues] = useState<ShiftRevenue[]>(mockShiftRevenues);
  const [deliveries, setDeliveries] = useState<DeliveryAppointment[]>(mockDeliveries);
  const [suppliers] = useState<Supplier[]>(mockSuppliers);
  const [processingTasks, setProcessingTasks] = useState<ProcessingTask[]>(() => 
    sortProcessingTasks(checkProcessingOverdue(mockProcessingTasks, getCurrentTime()), getCurrentTime())
  );
  const [processingStations] = useState<ProcessingStation[]>(mockProcessingStations);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfig[]>(mockShiftConfigs);
  const [workAreas] = useState<WorkArea[]>(mockWorkAreas);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>(mockShiftAssignments);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>(mockScrapItems);

  const selectedSnapshot = useMemo(() => {
    if (!selectedHistoryDate) return null;
    return snapshots.find(s => s.date === selectedHistoryDate) || null;
  }, [snapshots, selectedHistoryDate]);

  const displayProducts = useMemo(() => {
    return selectedSnapshot ? selectedSnapshot.products : products;
  }, [selectedSnapshot, products]);

  const displaySchedule = useMemo(() => {
    return selectedSnapshot ? selectedSnapshot.schedule : schedule;
  }, [selectedSnapshot, schedule]);

  const effectiveReminders = useMemo(() => {
    if (selectedSnapshot) return selectedSnapshot.reminders;
    return generateExpiryReminders(products, reminders);
  }, [selectedSnapshot, products, reminders]);

  const isHistoryMode = !!selectedHistoryDate;

  const filteredProducts = useMemo(() => {
    return displayProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedCategory === 'all') return matchesSearch;
      if (selectedCategory === 'expiring') return matchesSearch && (isExpiringProduct(product) || product.category === 'expiring');
      return matchesSearch && product.category === selectedCategory;
    });
  }, [displayProducts, selectedCategory, searchTerm]);

  const checkAndUpdateSchedule = useCallback(() => {
    if (isHistoryMode) return;
    const now = getCurrentTime();
    setCurrentTime(now);

    setSchedule(prevSchedule => {
      let updatedSchedule = checkTaskDependencies(prevSchedule);
      updatedSchedule = checkOverdueTasks(updatedSchedule, now);
      updatedSchedule = recalculateSchedule(updatedSchedule, now);
      
      const result = generateOverdueReminders(updatedSchedule, reminders, now);
      if (result.reminders.length !== reminders.length) {
        queueMicrotask(() => setReminders(result.reminders));
      }
      
      return result.updatedSchedule;
    });

    setProcessingTasks(prevTasks => {
      const updatedTasks = checkProcessingOverdue(prevTasks, now);
      const result = generateProcessingReminders(updatedTasks, reminders, now);
      if (result.reminders.length !== reminders.length) {
        queueMicrotask(() => setReminders(result.reminders));
      }
      return sortProcessingTasks(result.updatedTasks, now);
    });
  }, [reminders, isHistoryMode]);

  useEffect(() => {
    if (!isHistoryMode) {
      queueMicrotask(checkAndUpdateSchedule);
    }
    const interval = setInterval(checkAndUpdateSchedule, 30000);
    return () => clearInterval(interval);
  }, [isHistoryMode, checkAndUpdateSchedule]);

  const statistics = useMemo<Statistics>(() => {
    const lowStockCount = filteredProducts.filter(p => p.stock < p.maxStock * 0.3).length;
    const expiryStats = getExpiryStatistics(filteredProducts);
    const completedTasks = displaySchedule.filter(s => s.status === 'completed').length;
    const overdueTasks = displaySchedule.filter(s => s.isOverdue && s.status === 'pending').length;
    const estimatedFinishTime = isHistoryMode
      ? undefined
      : calculateTotalEstimatedFinishTime(displaySchedule, currentTime);

    return {
      totalProducts: filteredProducts.length,
      totalStock: filteredProducts.reduce((sum, p) => sum + p.stock, 0),
      lowStockCount,
      expiringCount: expiryStats.total,
      expiringCritical: expiryStats.critical,
      expiringWarning: expiryStats.warning,
      expiringAttention: expiryStats.attention,
      scheduledTasks: displaySchedule.length,
      completedTasks,
      overdueTasks,
      estimatedFinishTime,
    };
  }, [filteredProducts, displaySchedule, currentTime, isHistoryMode]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleScheduleStatusChange = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (isHistoryMode) return;
    const now = getCurrentTime();
    setSchedule(prev => {
      const targetTask = prev.find(item => item.id === id);
      if (!targetTask) return prev;

      if (status === 'in_progress' && isTaskBlocked(targetTask, prev)) {
        return prev;
      }

      let updated = prev.map(item => {
        if (item.id !== id) return item;
        
        const updates: Partial<ScheduleItem> = { status };
        
        if (status === 'in_progress' && !item.actualStartTime) {
          updates.actualStartTime = now;
          updates.isOverdue = false;
          updates.isBlocked = false;
          updates.blockReason = undefined;
        }
        
        if (status === 'completed' && !item.actualEndTime) {
          updates.actualEndTime = now;
          updates.isOverdue = false;
          updates.isBlocked = false;
          updates.blockReason = undefined;
        }
        
        if (status === 'pending') {
          updates.actualStartTime = undefined;
          updates.actualEndTime = undefined;
          updates.reminderSent = false;
        }
        
        return { ...item, ...updates };
      });

      updated = checkTaskDependencies(updated);
      
      return recalculateSchedule(updated, now);
    });
    
    setReminders(prev => prev.filter(r => r.scheduleId !== id || r.type !== 'overdue'));
  };

  const handlePrerequisitesChange = (taskId: string, prerequisiteIds: string[]) => {
    if (isHistoryMode) return;
    const now = getCurrentTime();
    setSchedule(prev => {
      let updated = prev.map(item => {
        if (item.id !== taskId) return item;
        return { ...item, prerequisiteIds };
      });
      updated = checkTaskDependencies(updated);
      return recalculateSchedule(updated, now);
    });
  };

  const handleDismissReminder = (id: string) => {
    if (isHistoryMode) return;
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleStockUpdate = (productId: string, amount: number) => {
    if (isHistoryMode) return;
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

  const handleSaveSnapshot = () => {
    const today = formatDate(new Date());
    const snapshot = createSnapshot(today, products, schedule, reminders);
    saveSnapshot(snapshot);
    setSnapshots(prev => {
      const filtered = prev.filter(s => s.date !== today);
      return [...filtered, snapshot];
    });
  };

  const handleHistoryDateSelect = (date: string | null) => {
    setSelectedHistoryDate(date);
    if (date) {
      setSelectedProduct(null);
    }
  };

  const handleQuickRestock = (productId: string) => {
    if (isHistoryMode) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const amount = product.maxStock - product.stock;
    if (amount <= 0) return;
    handleStockUpdate(productId, amount);
  };

  const handleMarkOutOfStock = (productId: string) => {
    if (isHistoryMode) return;
    setProducts(prev => prev.map(product =>
      product.id === productId
        ? { ...product, outOfStockRegistered: true }
        : product
    ));

    const product = products.find(p => p.id === productId);
    if (product && !product.outOfStockRegistered) {
      const now = getCurrentTime();
      const newReminder: Reminder = {
        id: `oos-${productId}-${Date.now()}`,
        productId,
        productName: product.name,
        message: `已标记缺货登记，当前库存: ${product.stock}`,
        time: now,
        type: 'low_stock',
      };
      setReminders(prev => [...prev, newReminder]);
    }

    if (selectedProduct?.id === productId) {
      setSelectedProduct({ ...selectedProduct, outOfStockRegistered: true });
    }
  };

  const handleMoveToExpiring = (productId: string) => {
    if (isHistoryMode) return;
    setProducts(prev => prev.map(product =>
      product.id === productId && product.category !== 'expiring'
        ? { ...product, category: 'expiring' as const }
        : product
    ));

    if (selectedProduct?.id === productId && selectedProduct.category !== 'expiring') {
      setSelectedProduct({ ...selectedProduct, category: 'expiring' });
    }
  };

  const handleBackToCurrent = () => {
    setSelectedHistoryDate(null);
  };

  const handleUpdateShift = (updatedShift: ShiftRevenue) => {
    setShiftRevenues(prev =>
      prev.map(s => (s.shiftId === updatedShift.shiftId ? updatedShift : s))
    );
  };

  const handleRegisterDelivery = (deliveryData: Omit<DeliveryAppointment, 'id' | 'deliveryNo' | 'qrCode' | 'registeredTime' | 'discrepancies'>) => {
    const todayDeliveries = deliveries.filter(d => d.scheduledDate === deliveryData.scheduledDate);
    const newDeliveryNo = getDeliveryNo(deliveryData.scheduledDate, todayDeliveries.length);
    const newQRCode = generateQRCode(newDeliveryNo, deliveryData.supplierName);
    const now = getCurrentTime();

    const newDelivery: DeliveryAppointment = {
      ...deliveryData,
      id: `del-${Date.now()}`,
      deliveryNo: newDeliveryNo,
      qrCode: newQRCode,
      registeredTime: now,
      discrepancies: [],
    };

    setDeliveries(prev => [...prev, newDelivery]);
  };

  const handleVerifyDelivery = (deliveryId: string, items: DeliveryItem[]) => {
    const now = getCurrentTime();
    
    setDeliveries(prev => prev.map(d => {
      if (d.id !== deliveryId) return d;
      
      const hasDiscrepancies = items.some(item => 
        item.actualQuantity !== undefined && item.actualQuantity !== item.expectedQuantity
      );
      
      return {
        ...d,
        items,
        status: hasDiscrepancies ? 'discrepancy' : 'completed',
        verifiedBy: '张夜班',
        verifiedTime: now,
      };
    }));
  };

  const handleReportDiscrepancy = (deliveryId: string, discrepancy: DeliveryDiscrepancy) => {
    setDeliveries(prev => prev.map(d => {
      if (d.id !== deliveryId) return d;
      return addDeliveryDiscrepancy(d, discrepancy);
    }));
  };

  const handleUpdateDeliveryStatus = (deliveryId: string, status: DeliveryAppointment['status']) => {
    setDeliveries(prev => prev.map(d => {
      if (d.id !== deliveryId) return d;
      return updateDeliveryStatus(d, status, '张夜班');
    }));
  };

  const handleAdvanceProcessingTask = (taskId: string) => {
    if (isHistoryMode) return;
    setProcessingTasks(prev => {
      let updated = advanceTaskStatus(prev, taskId, '张夜班');
      updated = checkProcessingOverdue(updated, currentTime);
      return sortProcessingTasks(updated, currentTime);
    });
  };

  const handleUpdateProcessingStep = (taskId: string, stepId: string, status: ProcessingStep['status']) => {
    if (isHistoryMode) return;
    setProcessingTasks(prev => {
      let updated = updateStepStatus(prev, taskId, stepId, status, '张夜班');
      updated = checkProcessingOverdue(updated, currentTime);
      return sortProcessingTasks(updated, currentTime);
    });
  };

  const processingStatistics = useMemo(() => {
    return calculateProcessingStatistics(processingTasks, processingStations, currentTime);
  }, [processingTasks, processingStations, currentTime]);

  const shelfHeatmapData = useMemo(() => {
    return generateShelfHeatmapData(displayProducts, snapshots, displaySchedule);
  }, [displayProducts, snapshots, displaySchedule]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className={`bg-white shadow-sm border-b border-gray-100 ${isHistoryMode ? 'border-t-4 border-t-indigo-500' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHistoryMode ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  夜班便利店补货排程器
                  {isHistoryMode && (
                    <span className="ml-2 text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      历史回溯模式
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500">Night Shift Convenience Store Replenishment Scheduler</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab('replenishment')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'replenishment'
                      ? 'bg-white text-blue-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  补货排程
                </button>
                <button
                  onClick={() => {
                    setActiveTab('processing');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'processing'
                      ? 'bg-white text-orange-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  鲜食加工
                </button>
                <button
                  onClick={() => {
                    setActiveTab('delivery');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'delivery'
                      ? 'bg-white text-blue-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  送货预约
                </button>
                <button
                  onClick={() => {
                    setActiveTab('reconciliation');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'reconciliation'
                      ? 'bg-white text-indigo-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  收银对账
                </button>
                <button
                  onClick={() => {
                    setActiveTab('heatmap');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'heatmap'
                      ? 'bg-white text-orange-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  热力分析
                </button>
                <button
                  onClick={() => {
                    setActiveTab('attendance');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'attendance'
                      ? 'bg-white text-teal-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  考勤管理
                </button>
                <button
                  onClick={() => {
                    setActiveTab('scrap');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'scrap'
                      ? 'bg-white text-red-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  报废管理
                </button>
              </div>
              {activeTab === 'replenishment' && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={handleBackToCurrent}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                      !isHistoryMode
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ListTodo className="w-4 h-4" />
                    当前排程
                  </button>
                  <button
                    onClick={() => !isHistoryMode && setSelectedHistoryDate(formatDate(new Date(Date.now() - 86400000)))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                      isHistoryMode
                        ? 'bg-white text-indigo-600 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    历史记录
                  </button>
                </div>
              )}
              <button
                onClick={toggleReminders}
                className={`relative p-2 rounded-lg transition-colors ${
                  showReminders ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {showReminders ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                {showReminders && effectiveReminders.length > 0 && !isHistoryMode && (activeTab === 'replenishment' || activeTab === 'processing') && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {effectiveReminders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'processing' ? (
          <ProcessingBoard
            tasks={processingTasks}
            stations={processingStations}
            statistics={processingStatistics}
            currentTime={currentTime}
            onAdvanceTask={handleAdvanceProcessingTask}
            onUpdateStepStatus={handleUpdateProcessingStep}
          />
        ) : activeTab === 'delivery' ? (
          <SupplierDeliveryBoard
            deliveries={deliveries}
            suppliers={suppliers}
            products={products}
            onRegisterDelivery={handleRegisterDelivery}
            onVerifyDelivery={handleVerifyDelivery}
            onReportDiscrepancy={handleReportDiscrepancy}
            onUpdateStatus={handleUpdateDeliveryStatus}
            onUpdateStock={handleStockUpdate}
            DeliveryRegistrationModal={DeliveryRegistrationModal}
            ScanVerificationModal={ScanVerificationModal}
            DiscrepancyReportModal={DiscrepancyReportModal}
          />
        ) : activeTab === 'reconciliation' ? (
          <NightReconciliation
            shifts={shiftRevenues}
            onUpdateShift={handleUpdateShift}
          />
        ) : activeTab === 'heatmap' ? (
          <ShelfHeatmap data={shelfHeatmapData} />
        ) : activeTab === 'attendance' ? (
          <EmployeeAttendance
            employees={employees}
            shifts={shiftConfigs}
            areas={workAreas}
            assignments={shiftAssignments}
            attendanceRecords={attendanceRecords}
            currentTime={currentTime}
            onUpdateAssignments={setShiftAssignments}
            onUpdateAttendanceRecords={setAttendanceRecords}
            onUpdateShifts={setShiftConfigs}
            onUpdateEmployees={setEmployees}
          />
        ) : activeTab === 'scrap' ? (
          <ScrapManagement
            items={scrapItems}
            products={products}
            onUpdateItems={setScrapItems}
          />
        ) : isHistoryMode ? (
          <div className="space-y-6">
            <HistoryTimeline
              snapshots={snapshots}
              selectedDate={selectedHistoryDate}
              onDateSelect={handleHistoryDateSelect}
              onBackToCurrent={handleBackToCurrent}
              onSaveSnapshot={handleSaveSnapshot}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <ProductPanel 
                  filteredProducts={filteredProducts}
                  onProductSelect={handleProductSelect}
                  selectedProductId={selectedProduct?.id ?? null}
                  selectedCategory={selectedCategory}
                  searchTerm={searchTerm}
                  onCategoryChange={setSelectedCategory}
                  onSearchChange={setSearchTerm}
                  onQuickRestock={handleQuickRestock}
                  onMarkOutOfStock={handleMarkOutOfStock}
                  onMoveToExpiring={handleMoveToExpiring}
                />
              </div>
              <div className="lg:col-span-5">
                <ScheduleTimeline 
                  schedule={displaySchedule} 
                  onStatusChange={handleScheduleStatusChange}
                  onPrerequisitesChange={handlePrerequisitesChange}
                  selectedProductId={selectedProduct?.id ?? null}
                />
              </div>
              <div className="lg:col-span-3">
                <StockCalculator 
                  products={displayProducts} 
                  selectedProduct={selectedProduct} 
                  onReplenish={handleStockUpdate}
                />
              </div>
            </div>
            <StatisticsSummary statistics={statistics} products={filteredProducts} schedule={displaySchedule} currentTime={currentTime} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <ProductPanel 
                  filteredProducts={filteredProducts}
                  onProductSelect={handleProductSelect}
                  selectedProductId={selectedProduct?.id ?? null}
                  selectedCategory={selectedCategory}
                  searchTerm={searchTerm}
                  onCategoryChange={setSelectedCategory}
                  onSearchChange={setSearchTerm}
                  onQuickRestock={handleQuickRestock}
                  onMarkOutOfStock={handleMarkOutOfStock}
                  onMoveToExpiring={handleMoveToExpiring}
                />
              </div>

              <div className="lg:col-span-5">
                <ScheduleTimeline 
                  schedule={displaySchedule} 
                  onStatusChange={handleScheduleStatusChange}
                  onPrerequisitesChange={handlePrerequisitesChange}
                  selectedProductId={selectedProduct?.id ?? null}
                />
              </div>

              <div className="lg:col-span-3">
                <StockCalculator 
                  products={displayProducts} 
                  selectedProduct={selectedProduct} 
                  onReplenish={handleStockUpdate}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <StatisticsSummary statistics={statistics} products={filteredProducts} schedule={displaySchedule} currentTime={currentTime} />
              <HistoryTimeline
                snapshots={snapshots}
                selectedDate={selectedHistoryDate}
                onDateSelect={handleHistoryDateSelect}
                onBackToCurrent={handleBackToCurrent}
                onSaveSnapshot={handleSaveSnapshot}
              />
            </div>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 夜班便利店补货排程器 | 为夜班员工提供高效补货管理
          </p>
        </div>
      </footer>

      {showReminders && !isHistoryMode && (activeTab === 'replenishment' || activeTab === 'processing') && (
        <ReminderModal reminders={effectiveReminders} onDismiss={handleDismissReminder} />
      )}
    </div>
  );
}
