import { useState, useMemo } from 'react';
import {
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  SkipForward,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  BarChart3,
  ClipboardList,
  Calendar,
  Route as RouteIcon,
  Image as ImageIcon,
  Trash2,
  Eye,
  ThumbsUp,
  ShieldAlert,
  Wrench,
  Thermometer,
  Sparkles,
  LayoutGrid,
  Package,
  Lightbulb,
  MoreHorizontal,
  FileText,
  Filter,
  ArrowRight,
} from 'lucide-react';
import type {
  PatrolCheckpoint,
  PatrolCheckpointStatus,
  PatrolRecord,
  PatrolRoute,
  PatrolStatistics,
  AnomalyRecord,
  AnomalyCategory,
  AnomalySeverity,
  AnomalyStatus,
  PatrolPhoto,
} from '../types';
import {
  ANOMALY_CATEGORIES,
  ANOMALY_SEVERITIES,
  ANOMALY_STATUSES,
  getAnomalyCategoryInfo,
  getAnomalySeverityInfo,
  getAnomalyStatusInfo,
  getCheckpointStatusInfo,
  generateWatermarkText,
  updateCheckpointStatus,
  updateCheckItemResult,
  addPhotoToCheckpoint,
  removePhotoFromCheckpoint,
  addAnomalyToCheckpoint,
  createPatrolRecordFromRoute,
  calculatePatrolStatistics,
  updateAnomalyStatus,
  createAnomalyRecord,
  getCurrentPatrolProgress,
  getNextPendingCheckpoint,
} from '../utils/patrolUtils';
import { formatDate } from '../utils/historyUtils';

interface NightPatrolProps {
  routes: PatrolRoute[];
  records: PatrolRecord[];
  anomalies: AnomalyRecord[];
  currentTime: string;
  operatorId: string;
  operatorName: string;
  onUpdateRecords: (records: PatrolRecord[]) => void;
  onUpdateAnomalies: (anomalies: AnomalyRecord[]) => void;
}

type SubTab = 'routes' | 'patrol' | 'anomalies' | 'statistics';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Package,
  Sparkles,
  Wrench,
  Lightbulb,
  Thermometer,
  ShieldAlert,
  MoreHorizontal,
};

export default function NightPatrol({
  routes,
  records,
  anomalies,
  currentTime,
  operatorId,
  operatorName,
  onUpdateRecords,
  onUpdateAnomalies,
}: NightPatrolProps) {
  const [subTab, setSubTab] = useState<SubTab>('patrol');
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState<PatrolPhoto | null>(null);
  const [anomalyFilter, setAnomalyFilter] = useState<AnomalyStatus | 'all'>('all');
  const [anomalyCategoryFilter, setAnomalyCategoryFilter] = useState<AnomalyCategory | 'all'>('all');
  const [anomalyModalCtx, setAnomalyModalCtx] = useState<{ checkpointId?: string; checkpointName?: string }>({});

  const selectedDateRecords = useMemo(
    () => records.filter(r => r.date === selectedDate),
    [records, selectedDate]
  );

  const activeRecord = useMemo(
    () => selectedDateRecords.find(r => r.status === 'in_progress') || selectedDateRecords[0] || null,
    [selectedDateRecords]
  );

  const selectedCheckpoint = useMemo(() => {
    if (!activeRecord || !selectedCheckpointId) return null;
    return activeRecord.checkpoints.find(cp => cp.id === selectedCheckpointId) || null;
  }, [activeRecord, selectedCheckpointId]);

  const selectedAnomaly = useMemo(() => {
    if (!selectedAnomalyId) return null;
    return anomalies.find(a => a.id === selectedAnomalyId) || null;
  }, [anomalies, selectedAnomalyId]);

  const statistics = useMemo(
    () => calculatePatrolStatistics(records, anomalies),
    [records, anomalies]
  );

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      if (anomalyFilter !== 'all' && a.status !== anomalyFilter) return false;
      if (anomalyCategoryFilter !== 'all' && a.category !== anomalyCategoryFilter) return false;
      return true;
    });
  }, [anomalies, anomalyFilter, anomalyCategoryFilter]);

  const handleStartPatrol = (route: PatrolRoute) => {
    const newRecord = createPatrolRecordFromRoute(route, operatorId, operatorName, currentTime);
    onUpdateRecords([...records, newRecord]);
  };

  const handleCheckpointStatusChange = (checkpointId: string, status: PatrolCheckpointStatus) => {
    if (!activeRecord) return;
    const updated = updateCheckpointStatus(activeRecord, checkpointId, status, currentTime);
    onUpdateRecords(records.map(r => (r.id === activeRecord.id ? updated : r)));
    if (status === 'in_progress') {
      setSelectedCheckpointId(checkpointId);
    }
  };

  const handleCheckItemResultChange = (checkpointId: string, checkItemId: string, result: string | number | boolean) => {
    if (!activeRecord) return;
    const updated = updateCheckItemResult(activeRecord, checkpointId, checkItemId, result);
    onUpdateRecords(records.map(r => (r.id === activeRecord.id ? updated : r)));
  };

  const handleAddPhoto = (checkpointId: string) => {
    if (!activeRecord) return;
    const checkpoint = activeRecord.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;
    const randomId = Math.random().toString(36).slice(2, 8);
    const photoUrl = `https://picsum.photos/seed/patrol-${randomId}/400/300`;
    const watermarkText = generateWatermarkText(operatorName, checkpoint.zone);
    const updated = addPhotoToCheckpoint(activeRecord, checkpointId, {
      url: photoUrl,
      watermarkText,
      watermarkLocation: checkpoint.zone,
      uploadedBy: operatorName,
    });
    onUpdateRecords(records.map(r => (r.id === activeRecord.id ? updated : r)));
  };

  const handleRemovePhoto = (checkpointId: string, photoId: string) => {
    if (!activeRecord) return;
    const updated = removePhotoFromCheckpoint(activeRecord, checkpointId, photoId);
    onUpdateRecords(records.map(r => (r.id === activeRecord.id ? updated : r)));
  };

  const handleCreateAnomaly = (data: {
    category: AnomalyCategory;
    severity: AnomalySeverity;
    title: string;
    description: string;
    photos: string[];
    checkpointId?: string;
    checkpointName?: string;
    shelfLocation?: string;
  }) => {
    const newAnomaly = createAnomalyRecord(
      {
        ...data,
        patrolRecordId: activeRecord?.id,
        reportedBy: operatorName,
        deadline: formatDate(new Date(Date.now() + 86400000)),
      },
      currentTime
    );
    onUpdateAnomalies([...anomalies, newAnomaly]);
    if (activeRecord && data.checkpointId) {
      const updated = addAnomalyToCheckpoint(activeRecord, data.checkpointId, newAnomaly.id);
      onUpdateRecords(records.map(r => (r.id === activeRecord.id ? updated : r)));
    }
    setShowAnomalyModal(false);
  };

  const handleUpdateAnomalyStatus = (anomalyId: string, status: AnomalyStatus) => {
    const updated = anomalies.map(a =>
      a.id === anomalyId ? updateAnomalyStatus(a, status, operatorName, currentTime) : a
    );
    onUpdateAnomalies(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSubTab('patrol')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'patrol'
                ? 'bg-white text-indigo-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <RouteIcon className="w-4 h-4" />
            巡店打卡
          </button>
          <button
            onClick={() => setSubTab('routes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'routes'
                ? 'bg-white text-blue-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            路线规划
          </button>
          <button
            onClick={() => setSubTab('anomalies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'anomalies'
                ? 'bg-white text-orange-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            异常追踪
            {statistics.openAnomalies > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                {statistics.openAnomalies}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('statistics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
              subTab === 'statistics'
                ? 'bg-white text-teal-600 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            统计分析
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setSelectedCheckpointId(null);
              }}
              className="text-sm bg-transparent outline-none text-gray-700"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 font-mono">{currentTime}</span>
          </div>
        </div>
      </div>

      {subTab === 'patrol' && (
        <PatrolPanel
          routes={routes}
          activeRecord={activeRecord}
          selectedCheckpoint={selectedCheckpoint}
          selectedCheckpointId={selectedCheckpointId}
          currentTime={currentTime}
          operatorName={operatorName}
          onStartPatrol={handleStartPatrol}
          onSelectCheckpoint={setSelectedCheckpointId}
          onCheckpointStatusChange={handleCheckpointStatusChange}
          onCheckItemResultChange={handleCheckItemResultChange}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          onOpenAnomaly={(cpId, cpName) => {
            setShowAnomalyModal(true);
            setSelectedCheckpointId(cpId);
            setAnomalyModalCtx({ checkpointId: cpId, checkpointName: cpName });
          }}
          onViewPhoto={setShowPhotoViewer}
        />
      )}

      {subTab === 'routes' && (
        <RoutesPanel
          routes={routes}
          records={records}
          selectedDate={selectedDate}
          onStartPatrol={handleStartPatrol}
        />
      )}

      {subTab === 'anomalies' && (
        <AnomaliesPanel
          anomalies={filteredAnomalies}
          allAnomalies={anomalies}
          selectedAnomaly={selectedAnomaly}
          anomalyFilter={anomalyFilter}
          setAnomalyFilter={setAnomalyFilter}
          anomalyCategoryFilter={anomalyCategoryFilter}
          setAnomalyCategoryFilter={setAnomalyCategoryFilter}
          onSelectAnomaly={setSelectedAnomalyId}
          onUpdateStatus={handleUpdateAnomalyStatus}
          operatorName={operatorName}
        />
      )}

      {subTab === 'statistics' && (
        <StatisticsPanel statistics={statistics} records={records} anomalies={anomalies} />
      )}

      {showAnomalyModal && (
        <AnomalyModal
          checkpointId={anomalyModalCtx.checkpointId}
          checkpointName={anomalyModalCtx.checkpointName}
          shelfLocation={selectedCheckpoint?.shelfLocation}
          existingPhotos={selectedCheckpoint?.photos.map(p => p.url) || []}
          onClose={() => {
            setShowAnomalyModal(false);
            setAnomalyModalCtx({});
          }}
          onSubmit={handleCreateAnomaly}
        />
      )}

      {showPhotoViewer && (
        <PhotoViewer photo={showPhotoViewer} onClose={() => setShowPhotoViewer(null)} />
      )}
    </div>
  );
}

function PatrolPanel({
  routes,
  activeRecord,
  selectedCheckpoint,
  selectedCheckpointId,
  currentTime,
  operatorName,
  onStartPatrol,
  onSelectCheckpoint,
  onCheckpointStatusChange,
  onCheckItemResultChange,
  onAddPhoto,
  onRemovePhoto,
  onOpenAnomaly,
  onViewPhoto,
}: {
  routes: PatrolRoute[];
  activeRecord: PatrolRecord | null;
  selectedCheckpoint: PatrolCheckpoint | null;
  selectedCheckpointId: string | null;
  currentTime: string;
  operatorName: string;
  onStartPatrol: (route: PatrolRoute) => void;
  onSelectCheckpoint: (id: string | null) => void;
  onCheckpointStatusChange: (checkpointId: string, status: PatrolCheckpointStatus) => void;
  onCheckItemResultChange: (checkpointId: string, checkItemId: string, result: string | number | boolean) => void;
  onAddPhoto: (checkpointId: string) => void;
  onRemovePhoto: (checkpointId: string, photoId: string) => void;
  onOpenAnomaly: (checkpointId: string, checkpointName?: string) => void;
  onViewPhoto: (photo: PatrolPhoto) => void;
}) {
  const progress = activeRecord ? getCurrentPatrolProgress(activeRecord) : 0;
  const nextCp = activeRecord ? getNextPendingCheckpoint(activeRecord) : null;

  if (!activeRecord) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <RouteIcon className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无进行中的巡店</h3>
        <p className="text-gray-500 mb-6">选择一条路线开始夜间巡店打卡</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {routes.map(route => (
            <div
              key={route.id}
              className="border border-gray-200 rounded-xl p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{route.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    预计 {route.estimatedDuration} 分钟 · {route.totalCheckpoints} 个检查点
                  </p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  {route.shift === 'night' ? '夜班' : '白班'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {route.zones.slice(0, 4).map(zone => (
                  <span key={zone} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {zone}
                  </span>
                ))}
                {route.zones.length > 4 && (
                  <span className="text-xs text-gray-400">+{route.zones.length - 4}</span>
                )}
              </div>
              <button
                onClick={() => onStartPatrol(route)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                开始巡店
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{activeRecord.patrolRouteName}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {activeRecord.operatorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeRecord.startTime}
                  </span>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  activeRecord.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {activeRecord.status === 'in_progress' ? '进行中' : '已完成'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">巡店进度</span>
                <span className="font-semibold text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>已完成 {activeRecord.completedCheckpoints}/{activeRecord.totalCheckpoints}</span>
                <span className="text-orange-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  异常 {activeRecord.anomalyCount}
                </span>
              </div>
            </div>
          </div>
          <div className="p-3">
            {nextCp && activeRecord.status === 'in_progress' && (
              <div
                onClick={() => {
                  onSelectCheckpoint(nextCp.id);
                  onCheckpointStatusChange(nextCp.id, 'in_progress');
                }}
                className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRight className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span className="text-xs font-medium text-blue-700">下一检查点</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {nextCp.order}. {nextCp.checkpointName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {nextCp.plannedTime}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {activeRecord.checkpoints
                .sort((a, b) => a.order - b.order)
                .map(cp => {
                  const statusInfo = getCheckpointStatusInfo(cp.status);
                  const isSelected = selectedCheckpointId === cp.id;
                  const hasAnomaly = (cp.anomalies?.length || 0) > 0;
                  return (
                    <div
                      key={cp.id}
                      onClick={() => onSelectCheckpoint(cp.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              cp.status === 'completed'
                                ? 'bg-green-500 text-white'
                                : cp.status === 'in_progress'
                                ? 'bg-blue-500 text-white'
                                : cp.status === 'skipped'
                                ? 'bg-orange-400 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {cp.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : cp.status === 'in_progress' ? (
                              <CircleDot className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-medium">{cp.order}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800 text-sm truncate">
                                {cp.checkpointName}
                              </span>
                              {hasAnomaly && (
                                <span className="flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="w-3 h-3" />
                                  {cp.anomalies!.length}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {cp.zone}
                              {cp.shelfLocation && ` · ${cp.shelfLocation}`}
                            </div>
                            {cp.actualArrivalTime && (
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span>到达 {cp.actualArrivalTime}</span>
                                {cp.actualLeaveTime && <span>离开 {cp.actualLeaveTime}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {cp.photos.length > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              <ImageIcon className="w-3 h-3" />
                              {cp.photos.length}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selectedCheckpoint ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">选择检查点开始巡检</h3>
            <p className="text-gray-500">点击左侧列表中的检查点查看详情并记录巡检内容</p>
          </div>
        ) : (
          <CheckpointDetail
            checkpoint={selectedCheckpoint}
            checkpointId={selectedCheckpointId!}
            currentTime={currentTime}
            operatorName={operatorName}
            isRecordActive={activeRecord.status === 'in_progress'}
            onStatusChange={status => onCheckpointStatusChange(selectedCheckpointId!, status)}
            onCheckItemResultChange={itemId => result =>
              onCheckItemResultChange(selectedCheckpointId!, itemId, result)
            }
            onAddPhoto={() => onAddPhoto(selectedCheckpointId!)}
            onRemovePhoto={photoId => onRemovePhoto(selectedCheckpointId!, photoId)}
            onOpenAnomaly={() =>
              onOpenAnomaly(selectedCheckpointId!, selectedCheckpoint.checkpointName)
            }
            onViewPhoto={onViewPhoto}
          />
        )}
      </div>
    </div>
  );
}

function CheckpointDetail({
  checkpoint,
  checkpointId: _checkpointId,
  currentTime: _currentTime,
  operatorName: _operatorName,
  isRecordActive,
  onStatusChange,
  onCheckItemResultChange,
  onAddPhoto,
  onRemovePhoto,
  onOpenAnomaly,
  onViewPhoto,
}: {
  checkpoint: PatrolCheckpoint;
  checkpointId: string;
  currentTime: string;
  operatorName: string;
  isRecordActive: boolean;
  onStatusChange: (status: PatrolCheckpointStatus) => void;
  onCheckItemResultChange: (checkItemId: string) => (result: string | number | boolean) => void;
  onAddPhoto: () => void;
  onRemovePhoto: (photoId: string) => void;
  onOpenAnomaly: () => void;
  onViewPhoto: (photo: PatrolPhoto) => void;
}) {
  const statusInfo = getCheckpointStatusInfo(checkpoint.status);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-800">
                  {checkpoint.order}. {checkpoint.checkpointName}
                </h2>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {checkpoint.zone}
                  {checkpoint.shelfLocation && ` · ${checkpoint.shelfLocation}`}
                </span>
                {checkpoint.plannedTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    计划 {checkpoint.plannedTime}
                  </span>
                )}
                {checkpoint.actualArrivalTime && (
                  <span className="text-green-600">到达 {checkpoint.actualArrivalTime}</span>
                )}
                {checkpoint.actualLeaveTime && (
                  <span className="text-blue-600">离开 {checkpoint.actualLeaveTime}</span>
                )}
              </div>
            </div>
            {isRecordActive && (
              <div className="flex items-center gap-2">
                {checkpoint.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange('in_progress')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <CircleDot className="w-4 h-4" />
                    开始巡检
                  </button>
                )}
                {(checkpoint.status === 'in_progress' || checkpoint.status === 'pending') && (
                  <button
                    onClick={() => onStatusChange('skipped')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    跳过
                  </button>
                )}
                {(checkpoint.status === 'in_progress' || checkpoint.status === 'pending') && (
                  <button
                    onClick={() => onStatusChange('completed')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    完成巡检
                  </button>
                )}
                {checkpoint.status === 'completed' && (
                  <button
                    onClick={() => onStatusChange('pending')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    重新巡检
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800">检查项目</h3>
          </div>
          <div className="space-y-3">
            {checkpoint.checkItems.map(item => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {item.required && (
                      <span className="text-xs text-red-500 font-medium">*必填</span>
                    )}
                    <span className="font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {item.type === 'boolean' ? '是/否' : item.type === 'numeric' ? `数值${item.unit ? `(${item.unit})` : ''}` : '文本'}
                  </span>
                </div>
                {item.type === 'boolean' && (
                  <div className="flex items-center gap-3">
                    {['是', '否'].map(val => {
                      const boolVal = val === '是';
                      const isSelected = item.result === boolVal;
                      return (
                        <button
                          key={val}
                          onClick={() => isRecordActive && onCheckItemResultChange(item.id)(boolVal)}
                          disabled={!isRecordActive}
                          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 disabled:opacity-50'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}
                {item.type === 'numeric' && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={(item.result as number) ?? ''}
                        onChange={e =>
                          isRecordActive &&
                          onCheckItemResultChange(item.id)(parseFloat(e.target.value) || 0)
                        }
                        disabled={!isRecordActive}
                        min={item.minValue}
                        max={item.maxValue}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                      {item.unit && (
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      )}
                    </div>
                    {(item.minValue !== undefined || item.maxValue !== undefined) && (
                      <span className="text-xs text-gray-400">
                        范围: {item.minValue ?? '-'} ~ {item.maxValue ?? '-'} {item.unit ?? ''}
                      </span>
                    )}
                  </div>
                )}
                {item.type === 'text' && (
                  <input
                    type="text"
                    value={(item.result as string) ?? ''}
                    onChange={e => isRecordActive && onCheckItemResultChange(item.id)(e.target.value)}
                    disabled={!isRecordActive}
                    placeholder="请输入备注..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">拍照水印上传</h3>
            </div>
            {isRecordActive && (
              <button
                onClick={onAddPhoto}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                拍照上传
              </button>
            )}
          </div>
          <div className="p-4">
            {checkpoint.photos.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">暂无照片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {checkpoint.photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-100"
                  >
                    <img
                      src={photo.url}
                      alt={photo.watermarkText}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs truncate">{photo.watermarkText}</p>
                      <p className="text-white/70 text-xs">{photo.watermarkTime.split(' ')[1]}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onViewPhoto(photo)}
                        className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      {isRecordActive && (
                        <button
                          onClick={() => onRemovePhoto(photo.id)}
                          className="p-1.5 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">异常登记</h3>
              {(checkpoint.anomalies?.length || 0) > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {checkpoint.anomalies!.length}项
                </span>
              )}
            </div>
            {isRecordActive && (
              <button
                onClick={onOpenAnomaly}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                登记异常
              </button>
            )}
          </div>
          <div className="p-4">
            {!checkpoint.anomalies || checkpoint.anomalies.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <ThumbsUp className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p className="text-sm">暂无异常，一切正常</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkpoint.anomalies.map(() => (
                  <div key={Math.random()} className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-sm text-gray-600">请切换到"异常追踪"标签页查看详细信息</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutesPanel({
  routes,
  records,
  selectedDate,
  onStartPatrol,
}: {
  routes: PatrolRoute[];
  records: PatrolRecord[];
  selectedDate: string;
  onStartPatrol: (route: PatrolRoute) => void;
}) {
  const todayRecords = records.filter(r => r.date === selectedDate);
  const hasStartedToday = (routeId: string) =>
    todayRecords.some(r => r.patrolRouteId === routeId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map(route => {
          const started = hasStartedToday(route.id);
          return (
            <div
              key={route.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <RouteIcon className="w-5 h-5 text-indigo-600" />
                      {route.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      预计 <span className="font-semibold text-indigo-600">{route.estimatedDuration}</span> 分钟 · 
                      共 <span className="font-semibold">{route.totalCheckpoints}</span> 个检查点
                    </p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                    {route.shift === 'night' ? '夜班专用' : '白班专用'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    巡检区域
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {route.zones.map(zone => (
                      <span
                        key={zone}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    巡检顺序
                  </h4>
                  <div className="space-y-2">
                    {route.checkpoints
                      .sort((a, b) => a.order - b.order)
                      .map(cp => (
                        <div
                          key={cp.id}
                          className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl"
                        >
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {cp.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">
                              {cp.checkpointName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cp.zone}
                              {cp.shelfLocation && ` · ${cp.shelfLocation}`}
                              {cp.plannedTime && ` · ${cp.plannedTime}`}
                            </p>
                          </div>
                          {cp.order < route.checkpoints.length && (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  {started ? (
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-700 font-medium">今日已开始此路线</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartPatrol(route)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                      开始此路线巡店
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnomaliesPanel({
  anomalies,
  allAnomalies,
  selectedAnomaly,
  anomalyFilter,
  setAnomalyFilter,
  anomalyCategoryFilter,
  setAnomalyCategoryFilter,
  onSelectAnomaly,
  onUpdateStatus,
  operatorName,
}: {
  anomalies: AnomalyRecord[];
  allAnomalies: AnomalyRecord[];
  selectedAnomaly: AnomalyRecord | null;
  anomalyFilter: AnomalyStatus | 'all';
  setAnomalyFilter: (status: AnomalyStatus | 'all') => void;
  anomalyCategoryFilter: AnomalyCategory | 'all';
  setAnomalyCategoryFilter: (cat: AnomalyCategory | 'all') => void;
  onSelectAnomaly: (id: string | null) => void;
  onUpdateStatus: (id: string, status: AnomalyStatus) => void;
  operatorName: string;
}) {
  const categoryStats = useMemo(() => {
    const map = new Map<AnomalyCategory, number>();
    allAnomalies.forEach(a => {
      map.set(a.category, (map.get(a.category) || 0) + 1);
    });
    return ANOMALY_CATEGORIES.map(cat => ({
      ...cat,
      count: map.get(cat.value as AnomalyCategory) || 0,
    }));
  }, [allAnomalies]);

  const statusStats = useMemo(() => {
    const map = new Map<AnomalyStatus, number>();
    allAnomalies.forEach(a => {
      map.set(a.status, (map.get(a.status) || 0) + 1);
    });
    return ANOMALY_STATUSES.map(st => ({
      ...st,
      count: map.get(st.value as AnomalyStatus) || 0,
    }));
  }, [allAnomalies]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusStats.map(st => (
          <button
            key={st.value}
            onClick={() => setAnomalyFilter(anomalyFilter === st.value ? 'all' : (st.value as AnomalyStatus))}
            className={`p-4 rounded-2xl border transition-all text-left ${
              anomalyFilter === st.value
                ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center ${st.color}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{st.count}</p>
            <p className="text-sm text-gray-500 mt-0.5">{st.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">筛选:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setAnomalyCategoryFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              anomalyCategoryFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {categoryStats.filter(c => c.count > 0).map(cat => {
            const IconComp = CATEGORY_ICONS[cat.icon];
            return (
              <button
                key={cat.value}
                onClick={() =>
                  setAnomalyCategoryFilter(
                    anomalyCategoryFilter === cat.value ? 'all' : (cat.value as AnomalyCategory)
                  )
                }
                className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  anomalyCategoryFilter === cat.value
                    ? cat.color + ' border border-current'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {IconComp && <IconComp className="w-3 h-3" />}
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">异常记录列表</h3>
            </div>
            {anomalies.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <ThumbsUp className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>暂无异常记录</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {anomalies.map(a => {
                  const catInfo = getAnomalyCategoryInfo(a.category);
                  const sevInfo = getAnomalySeverityInfo(a.severity);
                  const statusInfo = getAnomalyStatusInfo(a.status);
                  const IconComp = CATEGORY_ICONS[catInfo.icon];
                  const isSelected = selectedAnomaly?.id === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => onSelectAnomaly(isSelected ? null : a.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catInfo.color}`}>
                          {IconComp && <IconComp className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-gray-800 truncate">{a.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${sevInfo.color}`}>
                                  {sevInfo.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                <span className={catInfo.color.replace('border-', '').trim()}>
                                  {catInfo.label}
                                </span>
                                {a.checkpointName && (
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {a.checkpointName}
                                  </span>
                                )}
                                {a.shelfLocation && (
                                  <span>货架: {a.shelfLocation}</span>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {a.reportedBy} · {a.reportedAt}
                            </span>
                            <div className="flex items-center gap-2">
                              {a.photos.length > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <ImageIcon className="w-3 h-3" />
                                  {a.photos.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedAnomaly ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">选择异常查看详情</h3>
              <p className="text-gray-500">点击左侧列表中的异常记录查看详情并进行整改追踪</p>
            </div>
          ) : (
            <AnomalyDetail
              anomaly={selectedAnomaly}
              onUpdateStatus={onUpdateStatus}
              operatorName={operatorName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AnomalyDetail({
  anomaly,
  onUpdateStatus,
  operatorName: _operatorName,
}: {
  anomaly: AnomalyRecord;
  onUpdateStatus: (id: string, status: AnomalyStatus) => void;
  operatorName: string;
}) {
  const catInfo = getAnomalyCategoryInfo(anomaly.category);
  const sevInfo = getAnomalySeverityInfo(anomaly.severity);
  const statusInfo = getAnomalyStatusInfo(anomaly.status);
  const IconComp = CATEGORY_ICONS[catInfo.icon];

  const nextStatuses: { value: AnomalyStatus; label: string; color: string }[] = [];
  if (anomaly.status === 'reported') {
    nextStatuses.push({ value: 'rectifying', label: '开始整改', color: 'bg-yellow-600' });
  }
  if (anomaly.status === 'rectifying') {
    nextStatuses.push({ value: 'verified', label: '整改完成待核实', color: 'bg-teal-600' });
  }
  if (anomaly.status === 'verified') {
    nextStatuses.push({ value: 'closed', label: '关闭异常', color: 'bg-gray-600' });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${catInfo.color}`}>
              {IconComp && <IconComp className="w-4.5 h-4.5" />}
            </div>
            <h3 className="font-semibold text-gray-800">异常详情</h3>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <h4 className="text-lg font-bold text-gray-800 mb-2">{anomaly.title}</h4>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${sevInfo.color}`}>
            严重程度: {sevInfo.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${catInfo.color}`}>
            {catInfo.label}
          </span>
          {anomaly.deadline && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              截止: {anomaly.deadline}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[550px] overflow-y-auto">
        <div>
          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">问题描述</h5>
          <p className="text-sm text-gray-700 leading-relaxed">{anomaly.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {anomaly.checkpointName && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <h5 className="text-xs text-gray-500 mb-1">检查点</h5>
              <p className="text-sm font-medium text-gray-800">{anomaly.checkpointName}</p>
            </div>
          )}
          {anomaly.shelfLocation && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <h5 className="text-xs text-gray-500 mb-1">货架位置</h5>
              <p className="text-sm font-medium text-gray-800">{anomaly.shelfLocation}</p>
            </div>
          )}
          {anomaly.productName && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <h5 className="text-xs text-gray-500 mb-1">关联商品</h5>
              <p className="text-sm font-medium text-gray-800">{anomaly.productName}</p>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-xl">
            <h5 className="text-xs text-gray-500 mb-1">上报人</h5>
            <p className="text-sm font-medium text-gray-800">{anomaly.reportedBy}</p>
          </div>
        </div>

        {anomaly.photos.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">现场照片 ({anomaly.photos.length}张)</h5>
            <div className="grid grid-cols-3 gap-2">
              {anomaly.photos.map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 aspect-[4/3]">
                  <img src={url} alt={`异常照片${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {anomaly.rectificationPlan && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">整改方案</h5>
            <p className="text-sm text-gray-700 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              {anomaly.rectificationPlan}
            </p>
          </div>
        )}

        {anomaly.rectificationNotes && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">整改说明</h5>
            <p className="text-sm text-gray-700 p-3 bg-green-50 rounded-xl border border-green-100">
              {anomaly.rectificationNotes}
            </p>
          </div>
        )}

        {anomaly.verificationNotes && (
          <div>
            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">核实意见</h5>
            <p className="text-sm text-gray-700 p-3 bg-teal-50 rounded-xl border border-teal-100">
              {anomaly.verificationNotes}
            </p>
          </div>
        )}

        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">上报时间</span>
            <span className="text-gray-700">{anomaly.reportedAt}</span>
          </div>
          {anomaly.assignedTo && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">责任人</span>
              <span className="text-gray-700">{anomaly.assignedTo}</span>
            </div>
          )}
          {anomaly.rectifiedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">整改完成</span>
              <span className="text-green-600">{anomaly.rectifiedAt}</span>
            </div>
          )}
          {anomaly.verifiedBy && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">核实人</span>
              <span className="text-gray-700">{anomaly.verifiedBy}</span>
            </div>
          )}
          {anomaly.closedBy && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">关闭人</span>
              <span className="text-gray-700">{anomaly.closedBy}</span>
            </div>
          )}
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
          {nextStatuses.map(ns => (
            <button
              key={ns.value}
              onClick={() => onUpdateStatus(anomaly.id, ns.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 ${ns.color} text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity`}
            >
              <ThumbsUp className="w-4 h-4" />
              {ns.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatisticsPanel({
  statistics,
  records,
  anomalies: _anomalies,
}: {
  statistics: PatrolStatistics;
  records: PatrolRecord[];
  anomalies: AnomalyRecord[];
}) {
  const avgCompletionRate = statistics.averageCompletionRate;
  const anomalyCategoryStats = statistics.byCategory;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard icon={<RouteIcon className="w-5 h-5" />} label="巡店次数" value={statistics.totalRoutes} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="已完成" value={statistics.completedRoutes} color="bg-green-50 text-green-600" />
        <StatCard icon={<CircleDot className="w-5 h-5" />} label="进行中" value={statistics.inProgressRoutes} color="bg-blue-50 text-blue-600" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="平均完成率" value={`${avgCompletionRate}%`} color="bg-teal-50 text-teal-600" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="异常总数" value={statistics.totalAnomalies} color="bg-orange-50 text-orange-600" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="待处理异常" value={statistics.openAnomalies} color="bg-red-50 text-red-600" />
        <StatCard icon={<Camera className="w-5 h-5" />} label="照片总数" value={statistics.totalPhotos} color="bg-purple-50 text-purple-600" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="平均耗时" value={`${statistics.averagePatrolDuration}分`} color="bg-blue-50 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">各区域巡检情况</h3>
          </div>
          <div className="p-5">
            {statistics.byZone.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">暂无数据</div>
            ) : (
              <div className="space-y-4">
                {statistics.byZone.map(z => {
                  const rate = z.total > 0 ? Math.round((z.completed / z.total) * 100) : 0;
                  return (
                    <div key={z.zone}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{z.zone}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-500">{z.completed}/{z.total}完成</span>
                          <span className="text-orange-500">异常{z.anomalies}</span>
                          <span className="font-semibold text-indigo-600">{rate}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">异常分类统计</h3>
          </div>
          <div className="p-5">
            {anomalyCategoryStats.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">暂无异常数据</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {anomalyCategoryStats.map(cs => {
                  const info = getAnomalyCategoryInfo(cs.category);
                  const IconComp = CATEGORY_ICONS[info.icon];
                  return (
                    <div key={cs.category} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${info.color}`}>
                          {IconComp && <IconComp className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{info.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-800">{cs.count}</span>
                        {cs.open > 0 && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            {cs.open}待处理
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">近期巡店记录</h3>
        </div>
        <div className="p-5">
          {records.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">暂无巡店记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">日期</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">路线</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">巡检员</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">开始时间</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">完成率</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">异常</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">照片</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map(r => {
                    const rate = r.totalCheckpoints > 0 ? Math.round(((r.completedCheckpoints + r.skippedCheckpoints) / r.totalCheckpoints) * 100) : 0;
                    const photos = r.checkpoints.reduce((s, cp) => s + cp.photos.length, 0);
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{r.date}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{r.patrolRouteName}</td>
                        <td className="py-3 px-4 text-gray-600">{r.operatorName}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono">{r.startTime}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={rate === 100 ? 'bg-green-500 h-1.5 rounded-full' : 'bg-indigo-500 h-1.5 rounded-full'}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{rate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {r.anomalyCount > 0 ? (
                            <span className="text-orange-600 font-medium">{r.anomalyCount}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{photos}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {r.status === 'completed' ? '已完成' : '进行中'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function AnomalyModal({
  checkpointId,
  checkpointName,
  shelfLocation,
  existingPhotos,
  onClose,
  onSubmit,
}: {
  checkpointId?: string;
  checkpointName?: string;
  shelfLocation?: string;
  existingPhotos?: string[];
  onClose: () => void;
  onSubmit: (data: {
    category: AnomalyCategory;
    severity: AnomalySeverity;
    title: string;
    description: string;
    photos: string[];
    checkpointId?: string;
    checkpointName?: string;
    shelfLocation?: string;
  }) => void;
}) {
  const [category, setCategory] = useState<AnomalyCategory>('shelf_display');
  const [severity, setSeverity] = useState<AnomalySeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const handleTogglePhoto = (url: string) => {
    setSelectedPhotos(prev =>
      prev.includes(url) ? prev.filter(p => p !== url) : [...prev, url]
    );
  };

  const handleAddRandomPhoto = () => {
    const randomId = Math.random().toString(36).slice(2, 8);
    const url = `https://picsum.photos/seed/anomaly-${randomId}/400/300`;
    setSelectedPhotos(prev => [...prev, url]);
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      category,
      severity,
      title: title.trim(),
      description: description.trim(),
      photos: selectedPhotos,
      checkpointId,
      checkpointName,
      shelfLocation,
    });
  };

  const allPhotos = [...(existingPhotos || []), ...selectedPhotos.filter(p => !(existingPhotos || []).includes(p))];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800">登记异常</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/50 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {checkpointName && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
              <span className="text-gray-500">关联检查点: </span>
              <span className="font-medium text-blue-700">{checkpointName}</span>
              {shelfLocation && <span className="text-gray-500 ml-3">货架: {shelfLocation}</span>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">异常分类</label>
            <div className="grid grid-cols-4 gap-2">
              {ANOMALY_CATEGORIES.map(cat => {
                const IconComp = CATEGORY_ICONS[cat.icon];
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center ${isSelected ? cat.color : 'bg-gray-100 text-gray-500'}`}>
                      {IconComp && <IconComp className="w-4 h-4" />}
                    </div>
                    <p className="text-xs font-medium text-gray-700">{cat.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">严重程度</label>
            <div className="flex gap-2">
              {ANOMALY_SEVERITIES.map(sev => {
                const isSelected = severity === sev.value;
                return (
                  <button
                    key={sev.value}
                    onClick={() => setSeverity(sev.value)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? `${sev.color} border-current ring-2 ring-offset-1`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {sev.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">异常标题 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请简要描述异常问题..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">详细描述 *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请详细描述异常情况，包括位置、影响范围等..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">现场照片</label>
              <button
                onClick={handleAddRandomPhoto}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                添加照片
              </button>
            </div>
            {allPhotos.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>暂无照片，点击上方"添加照片"模拟拍照</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {allPhotos.map((url, idx) => {
                  const isSelected = selectedPhotos.includes(url) || (existingPhotos || []).includes(url);
                  const isExisting = (existingPhotos || []).includes(url);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleTogglePhoto(url)}
                      className={`relative rounded-xl overflow-hidden border-2 aspect-[4/3] cursor-pointer transition-all ${
                        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={url} alt={`照片${idx + 1}`} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      {isExisting && (
                        <div className="absolute bottom-1.5 left-1.5 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                          巡检照片
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {selectedPhotos.length > 0 && (
              <p className="mt-2 text-xs text-indigo-600">
                已选择 {selectedPhotos.length} 张照片作为异常凭证
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim()}
            className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交异常登记
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ photo, onClose }: { photo: PatrolPhoto; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
            <div className="text-white">
              <p className="text-sm font-medium">{photo.watermarkText}</p>
              <p className="text-xs text-gray-400 mt-0.5">{photo.watermarkTime} · {photo.watermarkLocation}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="aspect-video bg-gray-900">
            <img src={photo.url} alt={photo.watermarkText} className="w-full h-full object-contain" />
          </div>
          <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-400 flex items-center justify-between">
            <span>上传人: {photo.uploadedBy}</span>
            <span>上传时间: {photo.uploadedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}