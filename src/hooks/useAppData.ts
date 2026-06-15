import { useState, useCallback, useEffect } from 'react';
import { apiService, type ApiResult } from '../services/apiService';
import { createModuleLogger } from '../utils/logger';
import type {
  Product,
  ScheduleItem,
  Reminder,
  StockSnapshot,
  ShiftRevenue,
  Supplier,
  DeliveryAppointment,
  ProcessingTask,
  ProcessingStation,
  Employee,
  ShiftConfig,
  WorkArea,
  ShiftAssignment,
  AttendanceRecord,
  ScrapItem,
  ShiftHandoverLog,
  PatrolRoute,
  PatrolRecord,
  AnomalyRecord,
  Equipment,
  TemperatureAlert,
  RepairRequest,
} from '../types';

const logger = createModuleLogger('useAppData');

export interface AppDataState {
  products: Product[];
  schedule: ScheduleItem[];
  reminders: Reminder[];
  snapshots: StockSnapshot[];
  shiftRevenues: ShiftRevenue[];
  suppliers: Supplier[];
  deliveries: DeliveryAppointment[];
  processingTasks: ProcessingTask[];
  processingStations: ProcessingStation[];
  employees: Employee[];
  shiftConfigs: ShiftConfig[];
  workAreas: WorkArea[];
  shiftAssignments: ShiftAssignment[];
  attendanceRecords: AttendanceRecord[];
  scrapItems: ScrapItem[];
  handoverLogs: ShiftHandoverLog[];
  patrolRoutes: PatrolRoute[];
  patrolRecords: PatrolRecord[];
  anomalyRecords: AnomalyRecord[];
  equipment: Equipment[];
  temperatureAlerts: TemperatureAlert[];
  repairRequests: RepairRequest[];
}

export interface UseAppDataResult extends AppDataState {
  loading: boolean;
  error: string | null;
  reloadAll: () => Promise<void>;
  reloadProducts: () => Promise<ApiResult<Product[]>>;
  reloadSchedule: () => Promise<ApiResult<ScheduleItem[]>>;
  reloadReminders: () => Promise<ApiResult<Reminder[]>>;
}

const initialData: AppDataState = {
  products: [],
  schedule: [],
  reminders: [],
  snapshots: [],
  shiftRevenues: [],
  suppliers: [],
  deliveries: [],
  processingTasks: [],
  processingStations: [],
  employees: [],
  shiftConfigs: [],
  workAreas: [],
  shiftAssignments: [],
  attendanceRecords: [],
  scrapItems: [],
  handoverLogs: [],
  patrolRoutes: [],
  patrolRecords: [],
  anomalyRecords: [],
  equipment: [],
  temperatureAlerts: [],
  repairRequests: [],
};

export function useAppData(autoLoad = true): UseAppDataResult {
  const [data, setData] = useState<AppDataState>(initialData);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const result = await apiService.getProducts();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, products: result.data! }));
    }
    return result;
  }, []);

  const loadSchedule = useCallback(async () => {
    const result = await apiService.getSchedule();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, schedule: result.data! }));
    }
    return result;
  }, []);

  const loadReminders = useCallback(async () => {
    const result = await apiService.getReminders();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, reminders: result.data! }));
    }
    return result;
  }, []);

  const loadSnapshots = useCallback(async () => {
    const result = await apiService.getHistoricalSnapshots();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, snapshots: result.data! }));
    }
    return result;
  }, []);

  const loadShiftRevenues = useCallback(async () => {
    const result = await apiService.getShiftRevenues();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, shiftRevenues: result.data! }));
    }
    return result;
  }, []);

  const loadSuppliers = useCallback(async () => {
    const result = await apiService.getSuppliers();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, suppliers: result.data! }));
    }
    return result;
  }, []);

  const loadDeliveries = useCallback(async () => {
    const result = await apiService.getDeliveries();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, deliveries: result.data! }));
    }
    return result;
  }, []);

  const loadProcessingTasks = useCallback(async () => {
    const result = await apiService.getProcessingTasks();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, processingTasks: result.data! }));
    }
    return result;
  }, []);

  const loadProcessingStations = useCallback(async () => {
    const result = await apiService.getProcessingStations();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, processingStations: result.data! }));
    }
    return result;
  }, []);

  const loadEmployees = useCallback(async () => {
    const result = await apiService.getEmployees();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, employees: result.data! }));
    }
    return result;
  }, []);

  const loadShiftConfigs = useCallback(async () => {
    const result = await apiService.getShiftConfigs();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, shiftConfigs: result.data! }));
    }
    return result;
  }, []);

  const loadWorkAreas = useCallback(async () => {
    const result = await apiService.getWorkAreas();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, workAreas: result.data! }));
    }
    return result;
  }, []);

  const loadShiftAssignments = useCallback(async () => {
    const result = await apiService.getShiftAssignments();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, shiftAssignments: result.data! }));
    }
    return result;
  }, []);

  const loadAttendanceRecords = useCallback(async () => {
    const result = await apiService.getAttendanceRecords();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, attendanceRecords: result.data! }));
    }
    return result;
  }, []);

  const loadScrapItems = useCallback(async () => {
    const result = await apiService.getScrapItems();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, scrapItems: result.data! }));
    }
    return result;
  }, []);

  const loadHandoverLogs = useCallback(async () => {
    const result = await apiService.getHandoverLogs();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, handoverLogs: result.data! }));
    }
    return result;
  }, []);

  const loadPatrolRoutes = useCallback(async () => {
    const result = await apiService.getPatrolRoutes();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, patrolRoutes: result.data! }));
    }
    return result;
  }, []);

  const loadPatrolRecords = useCallback(async () => {
    const result = await apiService.getPatrolRecords();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, patrolRecords: result.data! }));
    }
    return result;
  }, []);

  const loadAnomalyRecords = useCallback(async () => {
    const result = await apiService.getAnomalyRecords();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, anomalyRecords: result.data! }));
    }
    return result;
  }, []);

  const loadEquipment = useCallback(async () => {
    const result = await apiService.getEquipment();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, equipment: result.data! }));
    }
    return result;
  }, []);

  const loadTemperatureAlerts = useCallback(async () => {
    const result = await apiService.getTemperatureAlerts();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, temperatureAlerts: result.data! }));
    }
    return result;
  }, []);

  const loadRepairRequests = useCallback(async () => {
    const result = await apiService.getRepairRequests();
    if (result.success && result.data) {
      setData(prev => ({ ...prev, repairRequests: result.data! }));
    }
    return result;
  }, []);

  const loadAll = useCallback(async () => {
    logger.info('开始加载全部数据...');
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        loadProducts(),
        loadSchedule(),
        loadReminders(),
        loadSnapshots(),
        loadShiftRevenues(),
        loadSuppliers(),
        loadDeliveries(),
        loadProcessingTasks(),
        loadProcessingStations(),
        loadEmployees(),
        loadShiftConfigs(),
        loadWorkAreas(),
        loadShiftAssignments(),
        loadAttendanceRecords(),
        loadScrapItems(),
        loadHandoverLogs(),
        loadPatrolRoutes(),
        loadPatrolRecords(),
        loadAnomalyRecords(),
        loadEquipment(),
        loadTemperatureAlerts(),
        loadRepairRequests(),
      ]);

      const successResults = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      );
      const successCount = successResults.length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        const firstError = results.find(r => 
          r.status === 'fulfilled' && !r.value.success
        );
        const errorMsg = firstError && 'value' in firstError 
          ? firstError.value.error 
          : '未知错误';
        logger.warn(`${failedCount} 个数据加载失败`);
        setError(`${failedCount} 个数据加载失败: ${errorMsg}`);
      }

      logger.info(`数据加载完成: ${successCount}/${results.length} 成功`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '未知错误';
      logger.error('数据加载异常:', err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [
    loadProducts,
    loadSchedule,
    loadReminders,
    loadSnapshots,
    loadShiftRevenues,
    loadSuppliers,
    loadDeliveries,
    loadProcessingTasks,
    loadProcessingStations,
    loadEmployees,
    loadShiftConfigs,
    loadWorkAreas,
    loadShiftAssignments,
    loadAttendanceRecords,
    loadScrapItems,
    loadHandoverLogs,
    loadPatrolRoutes,
    loadPatrolRecords,
    loadAnomalyRecords,
    loadEquipment,
    loadTemperatureAlerts,
    loadRepairRequests,
  ]);

  useEffect(() => {
    if (autoLoad) {
      loadAll();
    }
  }, [autoLoad, loadAll]);

  return {
    ...data,
    loading,
    error,
    reloadAll: loadAll,
    reloadProducts: loadProducts,
    reloadSchedule: loadSchedule,
    reloadReminders: loadReminders,
  };
}
