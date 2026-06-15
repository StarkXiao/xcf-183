import { useState, useMemo, useEffect, useCallback } from 'react';
import { Store, Bell, BellOff, Clock, ListTodo, Receipt, Truck, ChefHat, Flame, Users, Trash2, ClipboardList, Zap, Route as RouteIcon, Cpu } from 'lucide-react';
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
import ShiftHandoverLogComponent from './components/ShiftHandoverLog';
import ReplenishmentForecast from './components/ReplenishmentForecast';
import NightPatrol from './components/NightPatrol';
import EquipmentMonitor from './components/EquipmentMonitor';
import type { Product, ScheduleItem, Reminder, Statistics, ShiftRevenue, DeliveryAppointment, Supplier, DeliveryItem, DeliveryDiscrepancy, ProcessingTask, ProcessingStation, ProcessingStep, Employee, ShiftConfig, WorkArea, ShiftAssignment, AttendanceRecord, ScrapItem, ShiftHandoverLog, PatrolRoute, PatrolRecord, AnomalyRecord, Equipment, TemperatureAlert, RepairRequest } from './types';
import { mockProducts, mockSchedule, mockReminders, mockHistoricalSnapshots, mockShiftRevenues, mockSuppliers, mockDeliveries, mockProcessingTasks, mockProcessingStations, mockEmployees, mockShiftConfigs, mockWorkAreas, mockShiftAssignments, mockAttendanceRecords, mockScrapItems, mockHandoverLogs, mockPatrolRoutes, mockPatrolRecords, mockAnomalyRecords, mockEquipment, mockTemperatureAlerts, mockRepairRequests } from './data/mockData';
import { config, isDevelopment, isProduction } from './config';
import { createModuleLogger } from './utils/logger';
import {
  getCurrentTime,
  checkOverdueTasks,
  recalculateSchedule,
  generateOverdueReminders,
  calculateTotalEstimatedFinishTime,
  checkTaskDependencies,
  isTaskBlocked,
} from './utils/scheduleUtils';
import { generateExpiryReminders } from './utils/expiryUtils';
import { formatDate, createSnapshot, saveSnapshot } from './utils/historyUtils';
import { useProductFilter } from './hooks/useProductFilter';
import { useInventory } from './hooks/useInventory';
import { useExpiration } from './hooks/useExpiration';
import { useProductDomain } from './hooks/useProductDomain';
import { useScheduleDomain } from './hooks/useScheduleDomain';
import { useReminderDomain } from './hooks/useReminderDomain';
import { useHistoryDomain } from './hooks/useHistoryDomain';
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
import { generateForecast } from './utils/forecastUtils';

const logger = createModuleLogger('App');

export default function App() {
  useEffect(() => {
    logger.info('应用启动');
    logger.debug('环境配置:', {
      env: config.env,
      useMock: config.useMock,
      logLevel: config.logLevel,
      apiBaseUrl: config.apiBaseUrl,
    });
    logger.info(`当前环境: ${config.env} | Mock: ${config.useMock ? '开启' : '关闭'} | 日志级别: ${config.logLevel}`);
  }, []);

  const { products, setProducts, selectedProduct, setSelectedProduct, selectedCategory, setSelectedCategory, searchTerm, setSearchTerm } = useProductDomain(mockProducts);
  const { schedule, setSchedule, currentTime, setCurrentTime } = useScheduleDomain(mockSchedule);
  const { reminders, setReminders, showReminders, setShowReminders } = useReminderDomain(() => generateExpiryReminders(mockProducts, mockReminders));
  const { snapshots, setSnapshots, selectedHistoryDate, setSelectedHistoryDate, selectedSnapshot, isHistoryMode } = useHistoryDomain(mockHistoricalSnapshots);
  const [activeTab, setActiveTab] = useState<'replenishment' | 'forecast' | 'reconciliation' | 'delivery' | 'processing' | 'heatmap' | 'attendance' | 'scrap' | 'handover' | 'patrol' | 'equipment'>('replenishment');
  const [equipment] = useState<Equipment[]>(mockEquipment);
  const [temperatureAlerts, setTemperatureAlerts] = useState<TemperatureAlert[]>(mockTemperatureAlerts);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>(mockRepairRequests);
  const [patrolRoutes] = useState<PatrolRoute[]>(mockPatrolRoutes);
  const [patrolRecords, setPatrolRecords] = useState<PatrolRecord[]>(mockPatrolRecords);
  const [anomalyRecords, setAnomalyRecords] = useState<AnomalyRecord[]>(mockAnomalyRecords);
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
  const [handoverLogs, setHandoverLogs] = useState<ShiftHandoverLog[]>(mockHandoverLogs);

  const displayProducts = useMemo(() => {
    return selectedSnapshot ? selectedSnapshot.products : products;
  }, [selectedSnapshot, products]);

  const displaySchedule = useMemo(() => {
    return selectedSnapshot ? selectedSnapshot.schedule : schedule;
  }, [selectedSnapshot, schedule]);

  const { effectiveReminders, expiryStatistics } = useExpiration(products, reminders, selectedSnapshot);

  const { filteredProducts } = useProductFilter(displayProducts, selectedCategory, searchTerm);

  const inventory = useInventory(filteredProducts);

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
  }, [reminders, isHistoryMode, setCurrentTime, setSchedule, setReminders]);

  useEffect(() => {
    if (!isHistoryMode) {
      queueMicrotask(checkAndUpdateSchedule);
    }
    const interval = setInterval(checkAndUpdateSchedule, 30000);
    return () => clearInterval(interval);
  }, [isHistoryMode, checkAndUpdateSchedule]);

  const statistics = useMemo<Statistics>(() => {
    const completedTasks = displaySchedule.filter(s => s.status === 'completed').length;
    const overdueTasks = displaySchedule.filter(s => s.isOverdue && s.status === 'pending').length;
    const estimatedFinishTime = isHistoryMode
      ? undefined
      : calculateTotalEstimatedFinishTime(displaySchedule, currentTime);

    return {
      totalProducts: filteredProducts.length,
      totalStock: inventory.totalStock,
      lowStockCount: inventory.lowStockProducts.length,
      expiringCount: expiryStatistics.total,
      expiringCritical: expiryStatistics.critical,
      expiringWarning: expiryStatistics.warning,
      expiringAttention: expiryStatistics.attention,
      scheduledTasks: displaySchedule.length,
      completedTasks,
      overdueTasks,
      estimatedFinishTime,
    };
  }, [filteredProducts, inventory.totalStock, inventory.lowStockProducts, expiryStatistics, displaySchedule, currentTime, isHistoryMode]);

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
        ? { ...product, stock: Math.min(product.stock + amount, product.maxStock), outOfStockRegistered: false }
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
      setSelectedProduct({ ...updatedProduct, stock: newStock, outOfStockRegistered: false });
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

  const handleMarkOutOfStock = (productId: string, registered: boolean) => {
    if (isHistoryMode) return;
    setProducts(prev => prev.map(product =>
      product.id === productId
        ? { ...product, outOfStockRegistered: registered }
        : product
    ));

    if (registered) {
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
    }

    if (selectedProduct?.id === productId) {
      setSelectedProduct({ ...selectedProduct, outOfStockRegistered: registered });
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

  const handleAddRepairRequest = (repair: Omit<RepairRequest, 'id' | 'logs' | 'reportedAt'>) => {
    const now = getCurrentTime();
    const newRepair: RepairRequest = {
      ...repair,
      id: `repair-${Date.now()}`,
      reportedAt: now,
      logs: [
        {
          id: `log-new-${Date.now()}`,
          repairId: `repair-${Date.now()}`,
          timestamp: now,
          status: 'pending',
          operator: repair.reportedBy,
          notes: '提交报修申请',
        },
      ],
    };
    setRepairRequests(prev => [...prev, newRepair]);
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

  const forecastData = useMemo(() => {
    return generateForecast(products, snapshots, {
      forecastDays: 3,
      safetyStockRatio: 0.3,
    });
  }, [products, snapshots]);

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
                    setActiveTab('forecast');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'forecast'
                      ? 'bg-white text-emerald-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  智能预测
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
                <button
                  onClick={() => {
                    setActiveTab('handover');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'handover'
                      ? 'bg-white text-indigo-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  交接班日志
                </button>
                <button
                  onClick={() => {
                    setActiveTab('patrol');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'patrol'
                      ? 'bg-white text-purple-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <RouteIcon className="w-4 h-4" />
                  巡店打卡
                </button>
                <button
                  onClick={() => {
                    setActiveTab('equipment');
                    setSelectedHistoryDate(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                    activeTab === 'equipment'
                      ? 'bg-white text-cyan-600 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  设备监控
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
                {showReminders && effectiveReminders.length > 0 && !isHistoryMode && (activeTab === 'replenishment' || activeTab === 'forecast' || activeTab === 'processing') && (
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
        {activeTab === 'forecast' ? (
          <ReplenishmentForecast
            forecast={forecastData}
            onReplenish={handleStockUpdate}
          />
        ) : activeTab === 'processing' ? (
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
        ) : activeTab === 'handover' ? (
          <ShiftHandoverLogComponent
            logs={handoverLogs}
            onUpdateLogs={setHandoverLogs}
            currentTime={currentTime}
          />
        ) : activeTab === 'patrol' ? (
          <NightPatrol
            routes={patrolRoutes}
            records={patrolRecords}
            anomalies={anomalyRecords}
            currentTime={currentTime}
            operatorId="emp-1"
            operatorName="张夜班"
            onUpdateRecords={setPatrolRecords}
            onUpdateAnomalies={setAnomalyRecords}
          />
        ) : activeTab === 'equipment' ? (
          <EquipmentMonitor
            equipment={equipment}
            alerts={temperatureAlerts}
            repairs={repairRequests}
            currentTime={currentTime}
            operatorName="张夜班"
            onUpdateAlerts={setTemperatureAlerts}
            onUpdateRepairs={setRepairRequests}
            onAddRepair={handleAddRepairRequest}
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
                  key={selectedProduct?.id}
                  products={displayProducts} 
                  selectedProduct={selectedProduct} 
                  onReplenish={handleStockUpdate}
                  onQuickRestock={handleQuickRestock}
                  onMarkOutOfStock={handleMarkOutOfStock}
                  onMoveToExpiring={handleMoveToExpiring}
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
                  key={selectedProduct?.id}
                  products={displayProducts} 
                  selectedProduct={selectedProduct} 
                  onReplenish={handleStockUpdate}
                  onQuickRestock={handleQuickRestock}
                  onMarkOutOfStock={handleMarkOutOfStock}
                  onMoveToExpiring={handleMoveToExpiring}
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
          <div className="flex items-center justify-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 夜班便利店补货排程器 | 为夜班员工提供高效补货管理
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isDevelopment()
                  ? 'bg-green-100 text-green-700'
                  : isProduction()
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}>
                {config.env}
              </span>
              {config.useMock && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Mock
                </span>
              )}
              <span className="text-xs text-gray-400">
                v{config.appVersion}
              </span>
            </div>
          </div>
        </div>
      </footer>

      {showReminders && !isHistoryMode && (activeTab === 'replenishment' || activeTab === 'forecast' || activeTab === 'processing') && (
        <ReminderModal reminders={effectiveReminders} onDismiss={handleDismissReminder} />
      )}
    </div>
  );
}
