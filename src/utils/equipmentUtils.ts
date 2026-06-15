import type {
  Equipment,
  EquipmentStatistics,
  TemperatureAlert,
  TemperatureAlertLevel,
  RepairRequest,
  RepairStatus,
  RepairLogEntry,
  EquipmentTypeOption,
} from '../types';

export const getTemperatureAlertLevel = (
  temperature: number,
  equipment: Equipment
): TemperatureAlertLevel => {
  if (
    temperature >= equipment.criticalThresholdMax ||
    temperature <= equipment.criticalThresholdMin
  ) {
    return 'critical';
  }
  if (
    temperature >= equipment.warningThresholdMax ||
    temperature <= equipment.warningThresholdMin
  ) {
    return 'warning';
  }
  return 'normal';
};

export const getEquipmentStatus = (equipment: Equipment): Equipment['status'] => {
  if (!equipment.isOnline) return 'offline';
  if (equipment.currentTemperature === undefined) return 'maintenance';
  const alertLevel = getTemperatureAlertLevel(equipment.currentTemperature, equipment);
  if (alertLevel === 'critical') return 'critical';
  if (alertLevel === 'warning') return 'warning';
  return 'normal';
};

export const getStatusColor = (status: Equipment['status']): string => {
  switch (status) {
    case 'normal':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    case 'maintenance':
      return 'bg-purple-500';
    case 'offline':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

export const getStatusTextColor = (status: Equipment['status']): string => {
  switch (status) {
    case 'normal':
      return 'text-green-700 bg-green-50';
    case 'warning':
      return 'text-yellow-700 bg-yellow-50';
    case 'critical':
      return 'text-red-700 bg-red-50';
    case 'maintenance':
      return 'text-purple-700 bg-purple-50';
    case 'offline':
      return 'text-gray-700 bg-gray-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

export const getStatusLabel = (status: Equipment['status']): string => {
  switch (status) {
    case 'normal':
      return '正常';
    case 'warning':
      return '预警';
    case 'critical':
      return '异常';
    case 'maintenance':
      return '维护中';
    case 'offline':
      return '离线';
    default:
      return '未知';
  }
};

export const getAlertLevelColor = (level: TemperatureAlertLevel): string => {
  switch (level) {
    case 'critical':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'normal':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
};

export const getAlertLevelTextColor = (level: TemperatureAlertLevel): string => {
  switch (level) {
    case 'critical':
      return 'text-red-700 bg-red-50';
    case 'warning':
      return 'text-yellow-700 bg-yellow-50';
    case 'normal':
      return 'text-green-700 bg-green-50';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

export const getAlertLevelLabel = (level: TemperatureAlertLevel): string => {
  switch (level) {
    case 'critical':
      return '严重';
    case 'warning':
      return '警告';
    case 'normal':
      return '正常';
    default:
      return '未知';
  }
};

export const calculateEquipmentStatistics = (
  equipment: Equipment[],
  alerts: TemperatureAlert[],
  repairs: RepairRequest[]
): EquipmentStatistics => {
  const totalEquipment = equipment.length;
  const onlineCount = equipment.filter(e => e.isOnline).length;
  const offlineCount = totalEquipment - onlineCount;
  const normalCount = equipment.filter(e => e.status === 'normal').length;
  const warningCount = equipment.filter(e => e.status === 'warning').length;
  const criticalCount = equipment.filter(e => e.status === 'critical').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance' || e.status === 'offline').length;

  const activeAlerts = alerts.filter(a => !a.resolved).length;
  const pendingRepairs = repairs.filter(r => r.status === 'pending' || r.status === 'assigned').length;
  const inProgressRepairs = repairs.filter(r => r.status === 'in_progress' || r.status === 'parts_ordered').length;

  const today = new Date().toISOString().split('T')[0];
  const completedRepairsToday = repairs.filter(
    r => r.status === 'completed' && r.completedAt?.startsWith(today)
  ).length;

  const completedRepairs = repairs.filter(r => r.status === 'completed' && r.actualStartTime && r.completedAt);
  let averageRepairDurationMinutes = 0;
  if (completedRepairs.length > 0) {
    const totalDuration = completedRepairs.reduce((sum, r) => {
      const start = new Date(`${today}T${r.actualStartTime}`);
      const end = new Date(`${today}T${r.completedAt}`);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);
    averageRepairDurationMinutes = Math.round(totalDuration / completedRepairs.length);
  }

  const typeLabels: Record<string, string> = {
    freezer: '冷冻柜',
    refrigerator: '冷藏柜',
    display_case: '展示柜',
    ice_maker: '制冰机',
    air_conditioner: '空调',
    other: '其他设备',
  };

  const byType = Object.entries(typeLabels).map(([type, label]) => {
    const typeEquipment = equipment.filter(e => e.type === type);
    return {
      type: type as Equipment['type'],
      label,
      count: typeEquipment.length,
      normal: typeEquipment.filter(e => e.status === 'normal').length,
      warning: typeEquipment.filter(e => e.status === 'warning').length,
      critical: typeEquipment.filter(e => e.status === 'critical').length,
    };
  }).filter(t => t.count > 0);

  const tempCompliant = equipment.filter(
    e =>
      e.currentTemperature !== undefined &&
      e.currentTemperature >= e.targetTemperatureMin &&
      e.currentTemperature <= e.targetTemperatureMax
  ).length;
  const tempMonitored = equipment.filter(e => e.currentTemperature !== undefined).length;
  const temperatureComplianceRate = tempMonitored > 0 ? Math.round((tempCompliant / tempMonitored) * 100) : 100;

  return {
    totalEquipment,
    onlineCount,
    offlineCount,
    normalCount,
    warningCount,
    criticalCount,
    maintenanceCount,
    activeAlerts,
    pendingRepairs,
    inProgressRepairs,
    completedRepairsToday,
    averageRepairDurationMinutes,
    byType,
    temperatureComplianceRate,
  };
};

export const addRepairLogEntry = (
  repair: RepairRequest,
  status: RepairStatus,
  operator: string,
  notes?: string
): RepairRequest => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const newLog: RepairLogEntry = {
    id: `log-${repair.id}-${Date.now()}`,
    repairId: repair.id,
    timestamp: timeStr,
    status,
    operator,
    notes,
  };

  const updatedRepair: RepairRequest = {
    ...repair,
    status,
    logs: [...repair.logs, newLog],
  };

  switch (status) {
    case 'assigned':
      updatedRepair.assignedAt = timeStr;
      break;
    case 'in_progress':
      if (!repair.actualStartTime) {
        updatedRepair.actualStartTime = timeStr;
      }
      break;
    case 'completed':
      updatedRepair.completedAt = timeStr;
      if (notes) {
        updatedRepair.resolutionNotes = notes;
      }
      break;
  }

  return updatedRepair;
};

export const acknowledgeAlert = (
  alert: TemperatureAlert,
  operatorName: string
): TemperatureAlert => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return {
    ...alert,
    acknowledged: true,
    acknowledgedBy: operatorName,
    acknowledgedAt: timeStr,
  };
};

export const resolveAlert = (
  alert: TemperatureAlert,
  resolutionNotes: string
): TemperatureAlert => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return {
    ...alert,
    resolved: true,
    resolvedAt: timeStr,
    resolutionNotes,
  };
};

export const getEquipmentTypeInfo = (
  type: Equipment['type'],
  options: EquipmentTypeOption[]
) => {
  return options.find((o: EquipmentTypeOption) => o.value === type) || options[options.length - 1];
};

export const formatDurationMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};
