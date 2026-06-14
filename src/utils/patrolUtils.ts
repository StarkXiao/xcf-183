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
} from '../types';
import { formatDate } from './historyUtils';

export const ANOMALY_CATEGORIES: { value: AnomalyCategory; label: string; icon: string; color: string }[] = [
  { value: 'shelf_display', label: '货架陈列', icon: 'LayoutGrid', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'stock_issue', label: '库存问题', icon: 'Package', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'hygiene', label: '卫生问题', icon: 'Sparkles', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { value: 'equipment', label: '设备故障', icon: 'Wrench', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'lighting', label: '照明问题', icon: 'Lightbulb', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'temperature', label: '温度异常', icon: 'Thermometer', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'safety', label: '安全隐患', icon: 'ShieldAlert', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'other', label: '其他问题', icon: 'MoreHorizontal', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const ANOMALY_SEVERITIES: { value: AnomalySeverity; label: string; color: string }[] = [
  { value: 'low', label: '低', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: '高', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: '严重', color: 'bg-red-100 text-red-700' },
];

export const ANOMALY_STATUSES: { value: AnomalyStatus; label: string; color: string }[] = [
  { value: 'reported', label: '已上报', color: 'bg-blue-100 text-blue-700' },
  { value: 'rectifying', label: '整改中', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'verified', label: '已核实', color: 'bg-teal-100 text-teal-700' },
  { value: 'closed', label: '已关闭', color: 'bg-gray-100 text-gray-600' },
];

export const CHECKPOINT_STATUSES: { value: PatrolCheckpointStatus; label: string; color: string }[] = [
  { value: 'pending', label: '待巡检', color: 'bg-gray-100 text-gray-500' },
  { value: 'in_progress', label: '巡检中', color: 'bg-blue-100 text-blue-600' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-600' },
  { value: 'skipped', label: '已跳过', color: 'bg-orange-100 text-orange-600' },
];

export const getAnomalyCategoryInfo = (category: AnomalyCategory) => {
  return ANOMALY_CATEGORIES.find(c => c.value === category) || ANOMALY_CATEGORIES[7];
};

export const getAnomalySeverityInfo = (severity: AnomalySeverity) => {
  return ANOMALY_SEVERITIES.find(s => s.value === severity) || ANOMALY_SEVERITIES[0];
};

export const getAnomalyStatusInfo = (status: AnomalyStatus) => {
  return ANOMALY_STATUSES.find(s => s.value === status) || ANOMALY_STATUSES[0];
};

export const getCheckpointStatusInfo = (status: PatrolCheckpointStatus) => {
  return CHECKPOINT_STATUSES.find(s => s.value === status) || CHECKPOINT_STATUSES[0];
};

export const generateWatermarkText = (operatorName: string, location: string): string => {
  return `夜班巡店 | ${operatorName} | ${location}`;
};

export const generateWatermarkTime = (): string => {
  const now = new Date();
  return `${formatDate(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

export const generateWatermarkedImage = (
  file: File,
  watermarkText: string,
  location: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const watermarkTime = generateWatermarkTime();
        const fontSize = Math.max(14, Math.floor(Math.min(img.width, img.height) * 0.025));
        const padding = fontSize * 0.8;
        const lineHeight = fontSize * 1.4;

        ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'left';

        const gradient = ctx.createLinearGradient(0, img.height - lineHeight * 3 - padding * 2, 0, img.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.3, 'rgba(0,0,0,0.75)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, img.height - lineHeight * 3 - padding * 2, img.width, lineHeight * 3 + padding * 2);

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText(watermarkText, padding, img.height - lineHeight * 2 - padding * 0.5);

        ctx.font = `${fontSize * 0.85}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`📍 ${location}`, padding, img.height - lineHeight - padding * 0.5);

        ctx.font = `${fontSize * 0.75}px monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(watermarkTime, padding, img.height - padding * 0.5);

        const logoSize = fontSize * 2;
        ctx.beginPath();
        ctx.arc(img.width - padding - logoSize / 2, img.height - padding - logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize * 0.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('夜巡', img.width - padding - logoSize / 2, img.height - padding - logoSize / 2 + fontSize * 0.2);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

export const processPhotoUpload = async (
  file: File,
  operatorName: string,
  location: string
): Promise<{ url: string; watermarkText: string; watermarkLocation: string }> => {
  const watermarkText = generateWatermarkText(operatorName, location);
  const url = await generateWatermarkedImage(file, watermarkText, location);
  return {
    url,
    watermarkText,
    watermarkLocation: location,
  };
};

export const updateCheckpointStatus = (
  record: PatrolRecord,
  checkpointId: string,
  status: PatrolCheckpointStatus,
  currentTime: string
): PatrolRecord => {
  const updatedCheckpoints = record.checkpoints.map(cp => {
    if (cp.id !== checkpointId) return cp;
    const updates: Partial<PatrolCheckpoint> = { status };
    if (status === 'in_progress' && !cp.actualArrivalTime) {
      updates.actualArrivalTime = currentTime;
    }
    if ((status === 'completed' || status === 'skipped') && !cp.actualLeaveTime) {
      updates.actualLeaveTime = currentTime;
    }
    if (status === 'pending') {
      updates.actualArrivalTime = undefined;
      updates.actualLeaveTime = undefined;
    }
    return { ...cp, ...updates };
  });

  const completedCheckpoints = updatedCheckpoints.filter(cp => cp.status === 'completed').length;
  const skippedCheckpoints = updatedCheckpoints.filter(cp => cp.status === 'skipped').length;

  let overallStatus = record.status;
  let endTime = record.endTime;
  if (completedCheckpoints + skippedCheckpoints === record.totalCheckpoints) {
    overallStatus = 'completed';
    endTime = currentTime;
  } else if (completedCheckpoints > 0 || updatedCheckpoints.some(cp => cp.status === 'in_progress')) {
    overallStatus = 'in_progress';
  }

  return {
    ...record,
    checkpoints: updatedCheckpoints,
    completedCheckpoints,
    skippedCheckpoints,
    status: overallStatus,
    endTime,
    durationMinutes: endTime ? calculateDurationMinutes(record.startTime, endTime) : undefined,
  };
};

export const updateCheckItemResult = (
  record: PatrolRecord,
  checkpointId: string,
  checkItemId: string,
  result: string | number | boolean
): PatrolRecord => {
  const updatedCheckpoints = record.checkpoints.map(cp => {
    if (cp.id !== checkpointId) return cp;
    return {
      ...cp,
      checkItems: cp.checkItems.map(item =>
        item.id === checkItemId ? { ...item, result } : item
      ),
    };
  });
  return { ...record, checkpoints: updatedCheckpoints };
};

export const addPhotoToCheckpoint = (
  record: PatrolRecord,
  checkpointId: string,
  photo: { url: string; watermarkText: string; watermarkLocation: string; uploadedBy: string }
): PatrolRecord => {
  const now = generateWatermarkTime();
  const updatedCheckpoints = record.checkpoints.map(cp => {
    if (cp.id !== checkpointId) return cp;
    return {
      ...cp,
      photos: [
        ...cp.photos,
        {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          checkpointId,
          url: photo.url,
          watermarkText: photo.watermarkText,
          watermarkTime: now,
          watermarkLocation: photo.watermarkLocation,
          uploadedBy: photo.uploadedBy,
          uploadedAt: now,
        },
      ],
    };
  });
  return { ...record, checkpoints: updatedCheckpoints };
};

export const removePhotoFromCheckpoint = (
  record: PatrolRecord,
  checkpointId: string,
  photoId: string
): PatrolRecord => {
  const updatedCheckpoints = record.checkpoints.map(cp => {
    if (cp.id !== checkpointId) return cp;
    return {
      ...cp,
      photos: cp.photos.filter(p => p.id !== photoId),
    };
  });
  return { ...record, checkpoints: updatedCheckpoints };
};

export const addAnomalyToCheckpoint = (
  record: PatrolRecord,
  checkpointId: string,
  anomalyId: string
): PatrolRecord => {
  const updatedCheckpoints = record.checkpoints.map(cp => {
    if (cp.id !== checkpointId) return cp;
    return {
      ...cp,
      anomalies: [...(cp.anomalies || []), anomalyId],
    };
  });
  return { ...record, checkpoints: updatedCheckpoints, anomalyCount: record.anomalyCount + 1 };
};

export const createPatrolRecordFromRoute = (
  route: PatrolRoute,
  operatorId: string,
  operatorName: string,
  currentTime: string
): PatrolRecord => {
  const checkpoints = route.checkpoints.map(cp => ({
    ...cp,
    status: 'pending' as const,
    photos: [],
    anomalies: [],
  }));
  return {
    id: `patrol-${Date.now()}`,
    patrolRouteId: route.id,
    patrolRouteName: route.name,
    date: formatDate(new Date()),
    startTime: currentTime,
    status: 'in_progress',
    operatorId,
    operatorName,
    checkpoints,
    totalCheckpoints: route.totalCheckpoints,
    completedCheckpoints: 0,
    skippedCheckpoints: 0,
    anomalyCount: 0,
  };
};

export const calculateDurationMinutes = (startTime: string, endTime: string): number => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60;
  return endMins - startMins;
};

export const calculatePatrolStatistics = (
  records: PatrolRecord[],
  anomalies: AnomalyRecord[]
): PatrolStatistics => {
  const totalRoutes = records.length;
  const completedRoutes = records.filter(r => r.status === 'completed').length;
  const inProgressRoutes = records.filter(r => r.status === 'in_progress').length;

  const totalCheckpoints = records.reduce((sum, r) => sum + r.totalCheckpoints, 0);
  const completedCheckpoints = records.reduce((sum, r) => sum + r.completedCheckpoints, 0);
  const averageCompletionRate = totalCheckpoints > 0
    ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
    : 0;

  const totalAnomalies = anomalies.length;
  const openAnomalies = anomalies.filter(a => a.status !== 'closed').length;
  const closedAnomalies = anomalies.filter(a => a.status === 'closed').length;

  const durations = records
    .filter(r => r.durationMinutes !== undefined)
    .map(r => r.durationMinutes as number);
  const averagePatrolDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const totalPhotos = records.reduce(
    (sum, r) => sum + r.checkpoints.reduce((s, cp) => s + cp.photos.length, 0),
    0
  );

  const zoneMap = new Map<string, { total: number; completed: number; anomalies: number }>();
  records.forEach(r => {
    r.checkpoints.forEach(cp => {
      const existing = zoneMap.get(cp.zone) || { total: 0, completed: 0, anomalies: 0 };
      existing.total++;
      if (cp.status === 'completed') existing.completed++;
      if (cp.anomalies) existing.anomalies += cp.anomalies.length;
      zoneMap.set(cp.zone, existing);
    });
  });
  const byZone = Array.from(zoneMap.entries()).map(([zone, stats]) => ({ zone, ...stats }));

  const categoryMap = new Map<AnomalyCategory, { count: number; open: number }>();
  anomalies.forEach(a => {
    const existing = categoryMap.get(a.category) || { count: 0, open: 0 };
    existing.count++;
    if (a.status !== 'closed') existing.open++;
    categoryMap.set(a.category, existing);
  });
  const byCategory = Array.from(categoryMap.entries()).map(([category, stats]) => ({ category, ...stats }));

  return {
    totalRoutes,
    completedRoutes,
    inProgressRoutes,
    totalCheckpoints,
    completedCheckpoints,
    averageCompletionRate,
    totalAnomalies,
    openAnomalies,
    closedAnomalies,
    averagePatrolDuration,
    totalPhotos,
    byZone,
    byCategory,
  };
};

export const updateAnomalyStatus = (
  anomaly: AnomalyRecord,
  status: AnomalyStatus,
  operatorName: string,
  currentTime: string,
  extraData?: {
    rectificationPlan?: string;
    rectificationNotes?: string;
    rectificationPhotos?: string[];
    verificationNotes?: string;
    assignedTo?: string;
  }
): AnomalyRecord => {
  const updates: Partial<AnomalyRecord> = { status, ...extraData };
  if (status === 'rectifying') {
    updates.assignedAt = currentTime;
    updates.assignedTo = extraData?.assignedTo || operatorName;
  }
  if (status === 'verified' && !anomaly.verifiedAt) {
    updates.verifiedAt = currentTime;
    updates.verifiedBy = operatorName;
    updates.rectifiedAt = currentTime;
  }
  if (status === 'closed' && !anomaly.closedAt) {
    updates.closedAt = currentTime;
    updates.closedBy = operatorName;
  }
  return { ...anomaly, ...updates };
};

export const createAnomalyRecord = (
  data: {
    patrolRecordId?: string;
    checkpointId?: string;
    checkpointName?: string;
    category: AnomalyCategory;
    severity: AnomalySeverity;
    title: string;
    description: string;
    photos: string[];
    reportedBy: string;
    shelfLocation?: string;
    productId?: string;
    productName?: string;
    deadline?: string;
  },
  currentTime: string
): AnomalyRecord => {
  return {
    id: `anomaly-${Date.now()}`,
    ...data,
    reportedAt: currentTime,
    status: 'reported',
  };
};

export const getCurrentPatrolProgress = (record: PatrolRecord): number => {
  if (record.totalCheckpoints === 0) return 0;
  return Math.round(((record.completedCheckpoints + record.skippedCheckpoints) / record.totalCheckpoints) * 100);
};

export const getNextPendingCheckpoint = (record: PatrolRecord): PatrolCheckpoint | null => {
  const pending = record.checkpoints
    .filter(cp => cp.status === 'pending')
    .sort((a, b) => a.order - b.order);
  return pending.length > 0 ? pending[0] : null;
};
