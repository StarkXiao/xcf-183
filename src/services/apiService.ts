import { config } from '../config';
import { mockDelay } from '../utils/request';
import { createModuleLogger } from '../utils/logger';
import {
  mockProducts,
  mockSchedule,
  mockReminders,
  mockHistoricalSnapshots,
  mockShiftRevenues,
  mockSuppliers,
  mockDeliveries,
  mockProcessingTasks,
  mockProcessingStations,
  mockEmployees,
  mockShiftConfigs,
  mockWorkAreas,
  mockShiftAssignments,
  mockAttendanceRecords,
  mockScrapItems,
  mockHandoverLogs,
  mockPatrolRoutes,
  mockPatrolRecords,
  mockAnomalyRecords,
  mockEquipment,
  mockTemperatureAlerts,
  mockRepairRequests,
} from '../data/mockData';
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

const logger = createModuleLogger('apiService');

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const wrapMock = async <T>(data: T, label: string): Promise<ApiResult<T>> => {
  logger.debug(`[Mock] ${label}`);
  const result = await mockDelay(data);
  return { success: true, data: result };
};

const mockApi = {
  getProducts: (): Promise<ApiResult<Product[]>> =>
    wrapMock(mockProducts, 'getProducts'),

  getSchedule: (): Promise<ApiResult<ScheduleItem[]>> =>
    wrapMock(mockSchedule, 'getSchedule'),

  getReminders: (): Promise<ApiResult<Reminder[]>> =>
    wrapMock(mockReminders, 'getReminders'),

  getHistoricalSnapshots: (): Promise<ApiResult<StockSnapshot[]>> =>
    wrapMock(mockHistoricalSnapshots, 'getHistoricalSnapshots'),

  getShiftRevenues: (): Promise<ApiResult<ShiftRevenue[]>> =>
    wrapMock(mockShiftRevenues, 'getShiftRevenues'),

  getSuppliers: (): Promise<ApiResult<Supplier[]>> =>
    wrapMock(mockSuppliers, 'getSuppliers'),

  getDeliveries: (): Promise<ApiResult<DeliveryAppointment[]>> =>
    wrapMock(mockDeliveries, 'getDeliveries'),

  getProcessingTasks: (): Promise<ApiResult<ProcessingTask[]>> =>
    wrapMock(mockProcessingTasks, 'getProcessingTasks'),

  getProcessingStations: (): Promise<ApiResult<ProcessingStation[]>> =>
    wrapMock(mockProcessingStations, 'getProcessingStations'),

  getEmployees: (): Promise<ApiResult<Employee[]>> =>
    wrapMock(mockEmployees, 'getEmployees'),

  getShiftConfigs: (): Promise<ApiResult<ShiftConfig[]>> =>
    wrapMock(mockShiftConfigs, 'getShiftConfigs'),

  getWorkAreas: (): Promise<ApiResult<WorkArea[]>> =>
    wrapMock(mockWorkAreas, 'getWorkAreas'),

  getShiftAssignments: (): Promise<ApiResult<ShiftAssignment[]>> =>
    wrapMock(mockShiftAssignments, 'getShiftAssignments'),

  getAttendanceRecords: (): Promise<ApiResult<AttendanceRecord[]>> =>
    wrapMock(mockAttendanceRecords, 'getAttendanceRecords'),

  getScrapItems: (): Promise<ApiResult<ScrapItem[]>> =>
    wrapMock(mockScrapItems, 'getScrapItems'),

  getHandoverLogs: (): Promise<ApiResult<ShiftHandoverLog[]>> =>
    wrapMock(mockHandoverLogs, 'getHandoverLogs'),

  getPatrolRoutes: (): Promise<ApiResult<PatrolRoute[]>> =>
    wrapMock(mockPatrolRoutes, 'getPatrolRoutes'),

  getPatrolRecords: (): Promise<ApiResult<PatrolRecord[]>> =>
    wrapMock(mockPatrolRecords, 'getPatrolRecords'),

  getAnomalyRecords: (): Promise<ApiResult<AnomalyRecord[]>> =>
    wrapMock(mockAnomalyRecords, 'getAnomalyRecords'),

  getEquipment: (): Promise<ApiResult<Equipment[]>> =>
    wrapMock(mockEquipment, 'getEquipment'),

  getTemperatureAlerts: (): Promise<ApiResult<TemperatureAlert[]>> =>
    wrapMock(mockTemperatureAlerts, 'getTemperatureAlerts'),

  getRepairRequests: (): Promise<ApiResult<RepairRequest[]>> =>
    wrapMock(mockRepairRequests, 'getRepairRequests'),
};

const realApi = {
  getProducts: async (): Promise<ApiResult<Product[]>> => {
    logger.debug('Fetching products from API...');
    return { success: false, error: 'API not implemented' };
  },

  getSchedule: async (): Promise<ApiResult<ScheduleItem[]>> => {
    logger.debug('Fetching schedule from API...');
    return { success: false, error: 'API not implemented' };
  },

  getReminders: async (): Promise<ApiResult<Reminder[]>> => {
    logger.debug('Fetching reminders from API...');
    return { success: false, error: 'API not implemented' };
  },

  getHistoricalSnapshots: async (): Promise<ApiResult<StockSnapshot[]>> => {
    logger.debug('Fetching historical snapshots from API...');
    return { success: false, error: 'API not implemented' };
  },

  getShiftRevenues: async (): Promise<ApiResult<ShiftRevenue[]>> => {
    logger.debug('Fetching shift revenues from API...');
    return { success: false, error: 'API not implemented' };
  },

  getSuppliers: async (): Promise<ApiResult<Supplier[]>> => {
    logger.debug('Fetching suppliers from API...');
    return { success: false, error: 'API not implemented' };
  },

  getDeliveries: async (): Promise<ApiResult<DeliveryAppointment[]>> => {
    logger.debug('Fetching deliveries from API...');
    return { success: false, error: 'API not implemented' };
  },

  getProcessingTasks: async (): Promise<ApiResult<ProcessingTask[]>> => {
    logger.debug('Fetching processing tasks from API...');
    return { success: false, error: 'API not implemented' };
  },

  getProcessingStations: async (): Promise<ApiResult<ProcessingStation[]>> => {
    logger.debug('Fetching processing stations from API...');
    return { success: false, error: 'API not implemented' };
  },

  getEmployees: async (): Promise<ApiResult<Employee[]>> => {
    logger.debug('Fetching employees from API...');
    return { success: false, error: 'API not implemented' };
  },

  getShiftConfigs: async (): Promise<ApiResult<ShiftConfig[]>> => {
    logger.debug('Fetching shift configs from API...');
    return { success: false, error: 'API not implemented' };
  },

  getWorkAreas: async (): Promise<ApiResult<WorkArea[]>> => {
    logger.debug('Fetching work areas from API...');
    return { success: false, error: 'API not implemented' };
  },

  getShiftAssignments: async (): Promise<ApiResult<ShiftAssignment[]>> => {
    logger.debug('Fetching shift assignments from API...');
    return { success: false, error: 'API not implemented' };
  },

  getAttendanceRecords: async (): Promise<ApiResult<AttendanceRecord[]>> => {
    logger.debug('Fetching attendance records from API...');
    return { success: false, error: 'API not implemented' };
  },

  getScrapItems: async (): Promise<ApiResult<ScrapItem[]>> => {
    logger.debug('Fetching scrap items from API...');
    return { success: false, error: 'API not implemented' };
  },

  getHandoverLogs: async (): Promise<ApiResult<ShiftHandoverLog[]>> => {
    logger.debug('Fetching handover logs from API...');
    return { success: false, error: 'API not implemented' };
  },

  getPatrolRoutes: async (): Promise<ApiResult<PatrolRoute[]>> => {
    logger.debug('Fetching patrol routes from API...');
    return { success: false, error: 'API not implemented' };
  },

  getPatrolRecords: async (): Promise<ApiResult<PatrolRecord[]>> => {
    logger.debug('Fetching patrol records from API...');
    return { success: false, error: 'API not implemented' };
  },

  getAnomalyRecords: async (): Promise<ApiResult<AnomalyRecord[]>> => {
    logger.debug('Fetching anomaly records from API...');
    return { success: false, error: 'API not implemented' };
  },

  getEquipment: async (): Promise<ApiResult<Equipment[]>> => {
    logger.debug('Fetching equipment from API...');
    return { success: false, error: 'API not implemented' };
  },

  getTemperatureAlerts: async (): Promise<ApiResult<TemperatureAlert[]>> => {
    logger.debug('Fetching temperature alerts from API...');
    return { success: false, error: 'API not implemented' };
  },

  getRepairRequests: async (): Promise<ApiResult<RepairRequest[]>> => {
    logger.debug('Fetching repair requests from API...');
    return { success: false, error: 'API not implemented' };
  },
};

export const apiService = config.useMock ? mockApi : realApi;

export const isMockEnabled = (): boolean => config.useMock;

export const toggleMock = (enabled: boolean): void => {
  config.useMock = enabled;
  logger.info(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
};

export { mockApi, realApi };
