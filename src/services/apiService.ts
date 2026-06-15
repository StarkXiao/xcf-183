import { config } from '../config';
import { mockDelay } from '../utils/request';
import { request } from '../utils/request';
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

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const wrapMock = async <T>(data: T, label: string): Promise<ApiResult<T>> => {
  logger.debug(`[Mock] ${label}`);
  const result = await mockDelay(data);
  return { success: true, data: result };
};

const handleApiResponse = async <T>(
  apiCall: Promise<{ code: number; message: string; data: T }>,
  label: string
): Promise<ApiResult<T>> => {
  try {
    logger.debug(`[API] ${label}`);
    const response = await apiCall;
    if (response.code === 0 || response.code === 200) {
      return { success: true, data: response.data };
    }
    logger.warn(`[API] ${label} failed: ${response.message}`);
    return { success: false, error: response.message };
  } catch (error) {
    logger.error(`[API] ${label} error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败',
    };
  }
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
  getProducts: (): Promise<ApiResult<Product[]>> =>
    handleApiResponse(
      request.get<Product[]>('/products'),
      'getProducts'
    ),

  getSchedule: (): Promise<ApiResult<ScheduleItem[]>> =>
    handleApiResponse(
      request.get<ScheduleItem[]>('/schedule'),
      'getSchedule'
    ),

  getReminders: (): Promise<ApiResult<Reminder[]>> =>
    handleApiResponse(
      request.get<Reminder[]>('/reminders'),
      'getReminders'
    ),

  getHistoricalSnapshots: (): Promise<ApiResult<StockSnapshot[]>> =>
    handleApiResponse(
      request.get<StockSnapshot[]>('/snapshots'),
      'getHistoricalSnapshots'
    ),

  getShiftRevenues: (): Promise<ApiResult<ShiftRevenue[]>> =>
    handleApiResponse(
      request.get<ShiftRevenue[]>('/shift-revenues'),
      'getShiftRevenues'
    ),

  getSuppliers: (): Promise<ApiResult<Supplier[]>> =>
    handleApiResponse(
      request.get<Supplier[]>('/suppliers'),
      'getSuppliers'
    ),

  getDeliveries: (): Promise<ApiResult<DeliveryAppointment[]>> =>
    handleApiResponse(
      request.get<DeliveryAppointment[]>('/deliveries'),
      'getDeliveries'
    ),

  getProcessingTasks: (): Promise<ApiResult<ProcessingTask[]>> =>
    handleApiResponse(
      request.get<ProcessingTask[]>('/processing/tasks'),
      'getProcessingTasks'
    ),

  getProcessingStations: (): Promise<ApiResult<ProcessingStation[]>> =>
    handleApiResponse(
      request.get<ProcessingStation[]>('/processing/stations'),
      'getProcessingStations'
    ),

  getEmployees: (): Promise<ApiResult<Employee[]>> =>
    handleApiResponse(
      request.get<Employee[]>('/employees'),
      'getEmployees'
    ),

  getShiftConfigs: (): Promise<ApiResult<ShiftConfig[]>> =>
    handleApiResponse(
      request.get<ShiftConfig[]>('/shift-configs'),
      'getShiftConfigs'
    ),

  getWorkAreas: (): Promise<ApiResult<WorkArea[]>> =>
    handleApiResponse(
      request.get<WorkArea[]>('/work-areas'),
      'getWorkAreas'
    ),

  getShiftAssignments: (): Promise<ApiResult<ShiftAssignment[]>> =>
    handleApiResponse(
      request.get<ShiftAssignment[]>('/shift-assignments'),
      'getShiftAssignments'
    ),

  getAttendanceRecords: (): Promise<ApiResult<AttendanceRecord[]>> =>
    handleApiResponse(
      request.get<AttendanceRecord[]>('/attendance-records'),
      'getAttendanceRecords'
    ),

  getScrapItems: (): Promise<ApiResult<ScrapItem[]>> =>
    handleApiResponse(
      request.get<ScrapItem[]>('/scrap-items'),
      'getScrapItems'
    ),

  getHandoverLogs: (): Promise<ApiResult<ShiftHandoverLog[]>> =>
    handleApiResponse(
      request.get<ShiftHandoverLog[]>('/handover-logs'),
      'getHandoverLogs'
    ),

  getPatrolRoutes: (): Promise<ApiResult<PatrolRoute[]>> =>
    handleApiResponse(
      request.get<PatrolRoute[]>('/patrol/routes'),
      'getPatrolRoutes'
    ),

  getPatrolRecords: (): Promise<ApiResult<PatrolRecord[]>> =>
    handleApiResponse(
      request.get<PatrolRecord[]>('/patrol/records'),
      'getPatrolRecords'
    ),

  getAnomalyRecords: (): Promise<ApiResult<AnomalyRecord[]>> =>
    handleApiResponse(
      request.get<AnomalyRecord[]>('/anomalies'),
      'getAnomalyRecords'
    ),

  getEquipment: (): Promise<ApiResult<Equipment[]>> =>
    handleApiResponse(
      request.get<Equipment[]>('/equipment'),
      'getEquipment'
    ),

  getTemperatureAlerts: (): Promise<ApiResult<TemperatureAlert[]>> =>
    handleApiResponse(
      request.get<TemperatureAlert[]>('/temperature-alerts'),
      'getTemperatureAlerts'
    ),

  getRepairRequests: (): Promise<ApiResult<RepairRequest[]>> =>
    handleApiResponse(
      request.get<RepairRequest[]>('/repair-requests'),
      'getRepairRequests'
    ),
};

export type ApiService = typeof mockApi;

export const apiService: ApiService = config.useMock ? mockApi : realApi;

export const isMockEnabled = (): boolean => config.useMock;

export const toggleMock = (enabled: boolean): void => {
  config.useMock = enabled;
  logger.info(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
};

export { mockApi, realApi };
