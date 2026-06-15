import { useState, useMemo } from 'react';
import {
  Thermometer,
  AlertTriangle,
  Wrench,
  CheckCircle,
  Clock,
  MapPin,
  Cpu,
  Zap,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Snowflake,
  Wind,
  Box,
  Settings,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import type {
  Equipment,
  TemperatureAlert,
  RepairRequest,
  RepairStatus,
  RepairPriority,
  EquipmentType,
  TemperatureAlertLevel,
} from '../types';
import {
  getStatusColor,
  getStatusTextColor,
  getStatusLabel,
  getAlertLevelColor,
  getAlertLevelTextColor,
  getAlertLevelLabel,
  calculateEquipmentStatistics,
  addRepairLogEntry,
  acknowledgeAlert,
  resolveAlert,
  formatDurationMinutes,
} from '../utils/equipmentUtils';
import {
  EQUIPMENT_TYPE_OPTIONS,
  REPAIR_STATUS_OPTIONS,
  REPAIR_PRIORITY_OPTIONS,
} from '../data/mockData';

type EquipmentMonitorTab = 'overview' | 'alerts' | 'repairs';
type RepairFilterStatus = 'all' | RepairStatus;

interface EquipmentMonitorProps {
  equipment: Equipment[];
  alerts: TemperatureAlert[];
  repairs: RepairRequest[];
  currentTime: string;
  operatorName: string;
  onUpdateAlerts: (alerts: TemperatureAlert[]) => void;
  onUpdateRepairs: (repairs: RepairRequest[]) => void;
  onAddRepair: (repair: Omit<RepairRequest, 'id' | 'logs' | 'reportedAt'>) => void;
}

const getEquipmentIcon = (type: EquipmentType) => {
  switch (type) {
    case 'freezer':
      return Snowflake;
    case 'refrigerator':
      return Thermometer;
    case 'display_case':
      return Box;
    case 'ice_maker':
      return Box;
    case 'air_conditioner':
      return Wind;
    default:
      return Settings;
  }
};

const getEquipmentTypeColor = (type: EquipmentType) => {
  const option = EQUIPMENT_TYPE_OPTIONS.find(o => o.value === type);
  return option?.color || 'bg-gray-100 text-gray-700';
};

const getRepairStatusColor = (status: RepairStatus) => {
  const option = REPAIR_STATUS_OPTIONS.find(o => o.value === status);
  return option?.color || 'bg-gray-100 text-gray-700';
};

const getRepairStatusLabel = (status: RepairStatus) => {
  const option = REPAIR_STATUS_OPTIONS.find(o => o.value === status);
  return option?.label || status;
};

const getRepairPriorityColor = (priority: RepairPriority) => {
  const option = REPAIR_PRIORITY_OPTIONS.find(o => o.value === priority);
  return option?.color || 'bg-gray-100 text-gray-700';
};

const getRepairPriorityLabel = (priority: RepairPriority) => {
  const option = REPAIR_PRIORITY_OPTIONS.find(o => o.value === priority);
  return option?.label || priority;
};

const StatsCard = ({
  icon: Icon,
  label,
  value,
  color,
  subValue,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string | number;
  color: string;
  subValue?: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-50').replace('-700', '-50')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

const EquipmentCard = ({
  equipment,
  expanded,
  onToggle,
}: {
  equipment: Equipment;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const Icon = getEquipmentIcon(equipment.type);
  const statusColor = getStatusColor(equipment.status);
  const statusTextColor = getStatusTextColor(equipment.status);
  const typeColor = getEquipmentTypeColor(equipment.type);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all ${
        equipment.status === 'critical'
          ? 'border-red-200 ring-1 ring-red-100'
          : equipment.status === 'warning'
          ? 'border-yellow-200 ring-1 ring-yellow-100'
          : 'border-gray-100'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{equipment.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>
                  {EQUIPMENT_TYPE_OPTIONS.find(o => o.value === equipment.type)?.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {equipment.location}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {equipment.currentTemperature !== undefined && (
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    equipment.status === 'critical'
                      ? 'text-red-600'
                      : equipment.status === 'warning'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {equipment.currentTemperature}°C
                </div>
                <div className="text-xs text-gray-400">
                  {equipment.targetTemperatureMin} ~ {equipment.targetTemperatureMax}°C
                </div>
              </div>
            )}
            <div className="flex flex-col items-end gap-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusTextColor}`}>
                <span className="inline-flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${equipment.status !== 'normal' && equipment.status !== 'offline' ? 'animate-pulse' : ''}`}></span>
                  {getStatusLabel(equipment.status)}
                </span>
              </span>
              {equipment.isOnline && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  在线 · {equipment.lastUpdateTime}
                </span>
              )}
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">制造商</p>
                <p className="text-sm font-medium text-gray-700">{equipment.manufacturer || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">型号</p>
                <p className="text-sm font-medium text-gray-700">{equipment.model || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">序列号</p>
                <p className="text-sm font-medium text-gray-700">{equipment.serialNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">安装日期</p>
                <p className="text-sm font-medium text-gray-700">{equipment.installedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">上次维护</p>
                <p className="text-sm font-medium text-gray-700">{equipment.lastMaintenanceDate || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">下次维护</p>
                <p className="text-sm font-medium text-gray-700">{equipment.nextMaintenanceDate || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">预警阈值</p>
                <p className="text-sm font-medium text-gray-700">
                  {equipment.warningThresholdMin} ~ {equipment.warningThresholdMax}°C
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">临界阈值</p>
                <p className="text-sm font-medium text-gray-700">
                  {equipment.criticalThresholdMin} ~ {equipment.criticalThresholdMax}°C
                </p>
              </div>
            </div>

            {equipment.powerConsumption !== undefined && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>功耗: {equipment.powerConsumption} kW/h</span>
              </div>
            )}

            {equipment.temperatureHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  温度趋势（近24小时）
                </p>
                <div className="h-20 bg-gray-50 rounded-lg overflow-hidden flex items-end gap-0.5 p-2">
                  {equipment.temperatureHistory.map((reading) => {
                    const range = equipment.targetTemperatureMax - equipment.targetTemperatureMin;
                    const normalized = Math.max(
                      0,
                      Math.min(
                        100,
                        ((reading.temperature - equipment.targetTemperatureMin + range) / (range * 3)) *
                          100
                      )
                    );
                    return (
                      <div
                        key={reading.id}
                        className={`flex-1 rounded-t transition-all ${
                          reading.alertLevel === 'critical'
                            ? 'bg-red-400'
                            : reading.alertLevel === 'warning'
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                        }`}
                        style={{ height: `${Math.max(8, normalized)}%` }}
                        title={`${reading.recordedAt}: ${reading.temperature}°C`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AlertItem = ({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: TemperatureAlert;
  onAcknowledge: () => void;
  onResolve: () => void;
}) => {
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const alertColor = getAlertLevelColor(alert.alertLevel);
  const alertTextColor = getAlertLevelTextColor(alert.alertLevel);

  const handleResolve = () => {
    if (resolutionNotes.trim()) {
      onResolve();
      setShowResolve(false);
      setResolutionNotes('');
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-4 ${
        alert.resolved
          ? 'border-gray-200 opacity-75'
          : alert.alertLevel === 'critical'
          ? 'border-red-200'
          : 'border-yellow-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              alert.alertLevel === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
            }`}
          >
            {alert.resolved ? (
              <CheckCircle
                className={`w-5 h-5 ${
                  alert.alertLevel === 'critical' ? 'text-red-500' : 'text-yellow-500'
                }`}
              />
            ) : (
              <AlertTriangle
                className={`w-5 h-5 ${
                  alert.alertLevel === 'critical' ? 'text-red-500 animate-pulse' : 'text-yellow-500'
                }`}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-800">{alert.equipmentName}</h4>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${alertTextColor}`}
              >
                <span className="inline-flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${alertColor}`}></span>
                  {getAlertLevelLabel(alert.alertLevel)}
                </span>
              </span>
              {alert.resolved && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  已解决
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {alert.location}
            </p>
            <p className="text-sm mt-2">
              <span className="text-gray-600">当前温度: </span>
              <span
                className={`font-semibold ${
                  alert.alertLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'
                }`}
              >
                {alert.currentTemperature}°C
              </span>
              <span className="text-gray-500">
                {' '}
                (目标: {alert.targetMin} ~ {alert.targetMax}°C)
              </span>
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                触发时间: {alert.triggeredAt}
              </span>
              {alert.durationMinutes && !alert.resolved && (
                <span>持续: {formatDurationMinutes(alert.durationMinutes)}</span>
              )}
              {alert.acknowledged && alert.acknowledgedBy && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  已确认: {alert.acknowledgedBy} @ {alert.acknowledgedAt}
                </span>
              )}
              {alert.resolved && alert.resolvedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  解决于: {alert.resolvedAt}
                </span>
              )}
            </div>
            {alert.resolutionNotes && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                <span className="font-medium">处理说明: </span>
                {alert.resolutionNotes}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!alert.acknowledged && !alert.resolved && (
            <button
              onClick={onAcknowledge}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
            >
              确认报警
            </button>
          )}
          {alert.acknowledged && !alert.resolved && (
            <button
              onClick={() => setShowResolve(!showResolve)}
              className="px-3 py-1.5 text-sm rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              标记解决
            </button>
          )}
        </div>
      </div>

      {showResolve && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            处理说明
          </label>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="请输入问题解决说明..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowResolve(false)}
              className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleResolve}
              disabled={!resolutionNotes.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              确认解决
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RepairCard = ({
  repair,
  onUpdateStatus,
}: {
  repair: RepairRequest;
  onUpdateStatus: (status: RepairStatus, notes?: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<RepairStatus>('in_progress');
  const [statusNotes, setStatusNotes] = useState('');
  const Icon = getEquipmentIcon(repair.equipmentType);

  const nextStatuses: { value: RepairStatus; label: string }[] = (() => {
    switch (repair.status) {
      case 'pending':
        return [{ value: 'assigned', label: '派单' }];
      case 'assigned':
        return [{ value: 'in_progress', label: '开始维修' }];
      case 'in_progress':
        return [
          { value: 'parts_ordered', label: '申请配件' },
          { value: 'completed', label: '完成维修' },
        ];
      case 'parts_ordered':
        return [
          { value: 'in_progress', label: '继续维修' },
          { value: 'completed', label: '完成维修' },
        ];
      default:
        return [];
    }
  })();

  const handleStatusUpdate = () => {
    onUpdateStatus(newStatus, statusNotes || undefined);
    setShowStatusUpdate(false);
    setStatusNotes('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getEquipmentTypeColor(repair.equipmentType)}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-800">{repair.equipmentName}</h4>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRepairPriorityColor(repair.priority)}`}>
                  {getRepairPriorityLabel(repair.priority)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRepairStatusColor(repair.status)}`}>
                  {getRepairStatusLabel(repair.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {repair.location}
              </p>
              <p className="text-sm text-gray-700 mt-2">{repair.issueDescription}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  报修人: {repair.reportedBy}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {repair.reportedAt}
                </span>
                {repair.assignedTo && (
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" />
                    维修人员: {repair.assignedTo}
                  </span>
                )}
                {repair.estimatedCompletionTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    预计完成: {repair.estimatedCompletionTime}
                  </span>
                )}
                {repair.cost !== undefined && (
                  <span className="font-medium text-green-600">¥{repair.cost}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {nextStatuses.length > 0 && (
              <button
                onClick={() => {
                  setNewStatus(nextStatuses[0].value);
                  setShowStatusUpdate(!showStatusUpdate);
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                {nextStatuses[0].label}
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {showStatusUpdate && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  更新状态
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RepairStatus)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nextStatuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注（可选）
                </label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="操作说明..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowStatusUpdate(false)}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
              >
                确认更新
              </button>
            </div>
          </div>
        )}

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {repair.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  现场照片
                </p>
                <div className="flex gap-2 flex-wrap">
                  {repair.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`报修照片${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {repair.partsUsed && repair.partsUsed.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">更换配件</p>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">配件名称</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">数量</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">单价</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repair.partsUsed.map((part) => (
                        <tr key={part.partId} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-700">{part.partName}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{part.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-700">¥{part.unitPrice}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">
                            ¥{part.quantity * part.unitPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {repair.technicianNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">维修人员说明</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {repair.technicianNotes}
                </p>
              </div>
            )}

            {repair.resolutionNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">解决方案</p>
                <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3 border border-green-100">
                  {repair.resolutionNotes}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                处理日志
              </p>
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                <div className="space-y-3">
                  {repair.logs.map((log) => (
                    <div key={log.id} className="relative flex gap-3 pl-8">
                      <div
                        className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${getRepairStatusColor(log.status).replace('text-', 'bg-').replace('-700', '-500').replace('-600', '-500')}`}
                      ></div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getRepairStatusColor(log.status)}`}
                          >
                            {getRepairStatusLabel(log.status)}
                          </span>
                          <span className="text-xs text-gray-500">{log.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{log.operator}</span>
                          {log.notes && ` - ${log.notes}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NewRepairModal = ({
  isOpen,
  onClose,
  equipment,
  onSubmit,
  operatorName,
}: {
  isOpen: boolean;
  equipment: Equipment[];
  onSubmit: (repair: Omit<RepairRequest, 'id' | 'logs' | 'reportedAt'>) => void;
  onClose: () => void;
  operatorName: string;
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<RepairPriority>('medium');

  if (!isOpen) return null;

  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);

  const handleSubmit = () => {
    if (!selectedEquipmentId || !issueDescription.trim()) return;

    onSubmit({
      equipmentId: selectedEquipmentId,
      equipmentName: selectedEquipment?.name || '',
      equipmentType: selectedEquipment?.type || 'other',
      location: selectedEquipment?.location || '',
      reportedBy: operatorName,
      issueDescription: issueDescription.trim(),
      priority,
      status: 'pending',
      photos: [],
    });

    setSelectedEquipmentId('');
    setIssueDescription('');
    setPriority('medium');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" />
            提交报修申请
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择设备 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择设备...</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} - {e.location}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              故障描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="请详细描述设备故障情况..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              紧急程度
            </label>
            <div className="grid grid-cols-4 gap-2">
              {REPAIR_PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    priority === opt.value
                      ? `${opt.color} ring-2 ring-offset-1`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedEquipmentId || !issueDescription.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            提交报修
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EquipmentMonitor({
  equipment,
  alerts,
  repairs,
  currentTime,
  operatorName,
  onUpdateAlerts,
  onUpdateRepairs,
  onAddRepair,
}: EquipmentMonitorProps) {
  const [activeTab, setActiveTab] = useState<EquipmentMonitorTab>('overview');
  const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);
  const [showNewRepairModal, setShowNewRepairModal] = useState(false);
  const [repairFilter, setRepairFilter] = useState<RepairFilterStatus>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | TemperatureAlertLevel>('all');
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<'all' | EquipmentType>('all');

  const statistics = useMemo(
    () => calculateEquipmentStatistics(equipment, alerts, repairs),
    [equipment, alerts, repairs]
  );

  const filteredEquipment = useMemo(() => {
    if (equipmentTypeFilter === 'all') return equipment;
    return equipment.filter((e) => e.type === equipmentTypeFilter);
  }, [equipment, equipmentTypeFilter]);

  const activeAlerts = useMemo(() => alerts.filter((a) => !a.resolved), [alerts]);
  const resolvedAlerts = useMemo(() => alerts.filter((a) => a.resolved), [alerts]);

  const filteredAlerts = useMemo(() => {
    let result = activeTab === 'alerts' ? alerts : activeAlerts;
    if (alertFilter !== 'all') {
      result = result.filter((a) => a.alertLevel === alertFilter);
    }
    if (activeTab === 'alerts') {
      result = [...result].sort((a, b) => {
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        if (a.alertLevel !== b.alertLevel) {
          const levelOrder = { critical: 0, warning: 1, normal: 2 } as const;
          return levelOrder[a.alertLevel] - levelOrder[b.alertLevel];
        }
        return 0;
      });
    }
    return result;
  }, [alerts, activeTab, alertFilter]);

  const filteredRepairs = useMemo(() => {
    let result = [...repairs];
    if (repairFilter !== 'all') {
      result = result.filter((r) => r.status === repairFilter);
    }
    return result.sort((a, b) => {
      const statusOrder = {
        pending: 0,
        assigned: 1,
        in_progress: 2,
        parts_ordered: 3,
        completed: 4,
        cancelled: 5,
      } as const;
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [repairs, repairFilter]);

  const handleAcknowledgeAlert = (alertId: string) => {
    onUpdateAlerts(
      alerts.map((a) => (a.id === alertId ? acknowledgeAlert(a, operatorName) : a))
    );
  };

  const handleResolveAlert = (alertId: string, notes: string) => {
    onUpdateAlerts(
      alerts.map((a) => (a.id === alertId ? resolveAlert(a, notes) : a))
    );
  };

  const handleUpdateRepairStatus = (
    repairId: string,
    status: RepairStatus,
    notes?: string
  ) => {
    onUpdateRepairs(
      repairs.map((r) =>
        r.id === repairId ? addRepairLogEntry(r, status, operatorName, notes) : r
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-blue-500" />
            门店设备监控中心
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            实时监控设备运行状态、温度异常报警与维修进度跟踪
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            当前时间: <span className="font-medium text-gray-700">{currentTime}</span>
          </span>
          <button
            onClick={() => setShowNewRepairModal(true)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            提交报修
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatsCard
          icon={Cpu}
          label="设备总数"
          value={statistics.totalEquipment}
          color="text-blue-600"
          subValue={`在线 ${statistics.onlineCount} / 离线 ${statistics.offlineCount}`}
        />
        <StatsCard
          icon={CheckCircle}
          label="运行正常"
          value={statistics.normalCount}
          color="text-green-600"
        />
        <StatsCard
          icon={AlertTriangle}
          label="温度预警"
          value={statistics.warningCount}
          color="text-yellow-600"
        />
        <StatsCard
          icon={AlertCircle}
          label="温度异常"
          value={statistics.criticalCount}
          color="text-red-600"
        />
        <StatsCard
          icon={Wrench}
          label="待修/维修中"
          value={statistics.pendingRepairs + statistics.inProgressRepairs}
          color="text-orange-600"
          subValue={`待修 ${statistics.pendingRepairs} / 维修中 ${statistics.inProgressRepairs}`}
        />
        <StatsCard
          icon={Thermometer}
          label="温度达标率"
          value={`${statistics.temperatureComplianceRate}%`}
          color="text-emerald-600"
          subValue={`今日完成维修 ${statistics.completedRepairsToday} 单`}
        />
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            实时监控
            {activeAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {activeAlerts.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
            activeTab === 'alerts'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            超温报警
          </span>
        </button>
        <button
          onClick={() => setActiveTab('repairs')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
            activeTab === 'repairs'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Wrench className="w-4 h-4" />
            报修维修
          </span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {activeAlerts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" />
                当前异常报警 ({activeAlerts.length})
              </h3>
              <div className="space-y-3">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                    onResolve={() => handleResolveAlert(alert.id, '温度恢复正常')}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-500" />
              设备列表 ({filteredEquipment.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={equipmentTypeFilter}
                onChange={(e) => setEquipmentTypeFilter(e.target.value as 'all' | EquipmentType)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部类型</option>
                {EQUIPMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEquipment.map((eq) => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                expanded={expandedEquipment === eq.id}
                onToggle={() =>
                  setExpandedEquipment(expandedEquipment === eq.id ? null : eq.id)
                }
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                共 <span className="font-semibold">{filteredAlerts.length}</span> 条报警记录
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                未解决 {activeAlerts.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                已解决 {resolvedAlerts.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as 'all' | TemperatureAlertLevel)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">全部级别</option>
                <option value="critical">严重</option>
                <option value="warning">警告</option>
                <option value="normal">正常</option>
              </select>
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">暂无报警记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                  onResolve={() => handleResolveAlert(alert.id, '温度恢复正常')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'repairs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">
                共 <span className="font-semibold">{filteredRepairs.length}</span> 条报修记录
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                待处理 {repairs.filter((r) => r.status === 'pending').length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                已派单 {repairs.filter((r) => r.status === 'assigned').length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                维修中 {repairs.filter((r) => r.status === 'in_progress' || r.status === 'parts_ordered').length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                已完成 {repairs.filter((r) => r.status === 'completed').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={repairFilter}
                onChange={(e) => setRepairFilter(e.target.value as RepairFilterStatus)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部状态</option>
                {REPAIR_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewRepairModal(true)}
                className="px-3 py-1.5 text-sm rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                新建报修
              </button>
            </div>
          </div>

          {filteredRepairs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无报修记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRepairs.map((repair) => (
                <RepairCard
                  key={repair.id}
                  repair={repair}
                  onUpdateStatus={(status, notes) =>
                    handleUpdateRepairStatus(repair.id, status, notes)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <NewRepairModal
        isOpen={showNewRepairModal}
        onClose={() => setShowNewRepairModal(false)}
        equipment={equipment}
        onSubmit={onAddRepair}
        operatorName={operatorName}
      />
    </div>
  );
}
