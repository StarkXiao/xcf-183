import { useState } from 'react';
import { Clock, CheckCircle2, Circle, PlayCircle, AlertTriangle, Clock3, Lock, Link2, Settings } from 'lucide-react';
import type { ScheduleItem } from '../types';
import { getCurrentTime, calculateTimeDifference, sortScheduleByTime, getNextStatus } from '../utils/scheduleUtils';
import DependencyModal from './DependencyModal';

interface ScheduleTimelineProps {
  schedule: ScheduleItem[];
  onStatusChange: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onPrerequisitesChange: (taskId: string, prerequisiteIds: string[]) => void;
  selectedProductId: string | null;
}

const statusConfig = {
  pending: { icon: Circle, color: 'bg-gray-200 text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  in_progress: { icon: PlayCircle, color: 'bg-blue-200 text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  completed: { icon: CheckCircle2, color: 'bg-green-200 text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  overdue: { icon: AlertTriangle, color: 'bg-red-200 text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
  blocked: { icon: Lock, color: 'bg-amber-200 text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
};

export default function ScheduleTimeline({ schedule, onStatusChange, onPrerequisitesChange, selectedProductId }: ScheduleTimelineProps) {
  const referenceTime = getCurrentTime();
  const sortedSchedule = sortScheduleByTime(schedule, referenceTime);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleItem | null>(null);



  const handleOpenDependencyModal = (task: ScheduleItem) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseDependencyModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveDependencies = (taskId: string, prerequisiteIds: string[]) => {
    onPrerequisitesChange(taskId, prerequisiteIds);
    handleCloseDependencyModal();
  };

  const getStatusStyle = (item: ScheduleItem) => {
    if (item.isBlocked && item.status === 'pending') {
      return statusConfig.blocked;
    }
    if (item.isOverdue && item.status === 'pending') {
      return statusConfig.overdue;
    }
    return statusConfig[item.status];
  };

  const formatDelayTime = (item: ScheduleItem) => {
    if (!item.isOverdue) return null;
    const now = getCurrentTime();
    const delayMinutes = calculateTimeDifference(now, item.originalTime, now);
    if (delayMinutes < 1) return null;
    if (delayMinutes < 60) return `已逾期 ${delayMinutes} 分钟`;
    const hours = Math.floor(delayMinutes / 60);
    const mins = delayMinutes % 60;
    return `已逾期 ${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  };

  const getPrerequisiteNames = (item: ScheduleItem): string[] => {
    if (!item.prerequisiteIds || item.prerequisiteIds.length === 0) return [];
    return item.prerequisiteIds
      .map(id => schedule.find(s => s.id === id)?.productName)
      .filter((name): name is string => !!name);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">时间轴排程</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-600">阻塞</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">逾期</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">进行中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">已完成</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[26px] top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {sortedSchedule.map((item, index) => {
            const isBlocked = item.isBlocked && item.status === 'pending';
            const StatusIcon = isBlocked ? Lock : 
                              item.isOverdue && item.status === 'pending' ? AlertTriangle : 
                              statusConfig[item.status].icon;
            const nextStatus = getNextStatus(item.status);
            const style = getStatusStyle(item);
            const delayMsg = formatDelayTime(item);
            const isRescheduled = item.estimatedStartTime && item.time !== item.originalTime;
            const prerequisiteNames = getPrerequisiteNames(item);

            return (
              <div
                key={item.id}
                className={`relative pl-14 group ${
                  index === sortedSchedule.length - 1 ? 'pb-0' : ''
                }`}
              >
                <div
                  className={`absolute left-0 w-14 h-14 flex items-center justify-center ${isBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer transition-transform hover:scale-110'}`}
                  onClick={() => !isBlocked && onStatusChange(item.id, nextStatus)}
                >
                  <div className={`p-3 rounded-full ${style.bg} border-2 ${style.border}`}>
                    <StatusIcon className={`w-5 h-5 ${
                      isBlocked ? 'text-amber-700' :
                      item.isOverdue && item.status === 'pending' ? 'text-red-600' : 
                      statusConfig[item.status].color.replace('bg-', 'text-').replace('-200', '-600')
                    }`} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all ${isBlocked ? 'opacity-75' : 'hover:shadow-md'} ${
                  selectedProductId === item.productId
                    ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-400 bg-blue-50'
                    : `${style.border} ${style.bg}`
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-semibold text-gray-800">{item.time}</span>
                        {isRescheduled && (
                          <span className="text-xs text-gray-500 line-through">{item.originalTime}</span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          isBlocked ? 'bg-amber-200 text-amber-700' :
                          item.isOverdue && item.status === 'pending' ? 'bg-red-200 text-red-700' : 
                          statusConfig[item.status].color
                        }`}>
                          {isBlocked ? '已阻塞' :
                           item.isOverdue && item.status === 'pending' ? '已逾期' : 
                           item.status === 'pending' ? '待补货' : 
                           item.status === 'in_progress' ? '补货中' : '已完成'}
                        </span>
                        {isRescheduled && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Clock3 className="w-3 h-3" />
                            已重排
                          </span>
                        )}
                        {prerequisiteNames.length > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            依赖: {prerequisiteNames.join('、')}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDependencyModal(item);
                          }}
                          className="ml-1 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="设置前置依赖"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-gray-700 mt-1 font-medium">{item.productName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                        <span>补货数量: <span className="font-semibold text-gray-700">{item.quantity}</span></span>
                        <span>预计耗时: <span className="font-semibold text-gray-700">{item.estimatedDuration} 分钟</span></span>
                        {item.actualStartTime && (
                          <span>实际开始: <span className="font-semibold text-blue-600">{item.actualStartTime}</span></span>
                        )}
                        {item.actualEndTime && (
                          <span>实际完成: <span className="font-semibold text-green-600">{item.actualEndTime}</span></span>
                        )}
                      </div>
                      {isBlocked && item.blockReason && (
                        <div className="mt-2 flex items-center gap-1 text-amber-700 text-sm font-medium bg-amber-100 rounded-md px-2 py-1">
                          <Lock className="w-4 h-4" />
                          {item.blockReason}
                        </div>
                      )}
                      {delayMsg && !isBlocked && (
                        <div className="mt-2 flex items-center gap-1 text-red-600 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          {delayMsg}
                        </div>
                      )}
                      {isRescheduled && item.status === 'pending' && !isBlocked && (
                        <div className="mt-1 text-xs text-amber-600">
                          因前置任务延误，预计开始时间已调整
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => !isBlocked && onStatusChange(item.id, nextStatus)}
                      disabled={isBlocked}
                      className={`ml-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex-shrink-0 ${
                        isBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isBlocked ? '#d1d5db' :
                                        item.status === 'completed' ? '#f3f4f6' : 
                                        item.isOverdue && item.status === 'pending' ? '#dc2626' : '#3b82f6',
                        color: isBlocked || item.status === 'completed' ? '#6b7280' : 'white',
                      }}
                    >
                      {isBlocked ? '锁定' :
                       item.status === 'pending' ? '开始' : 
                       item.status === 'in_progress' ? '完成' : '重置'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DependencyModal
        isOpen={isModalOpen}
        task={editingTask}
        allTasks={schedule}
        onClose={handleCloseDependencyModal}
        onSave={handleSaveDependencies}
      />
    </div>
  );
}
