import { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, PlayCircle, AlertTriangle, Clock3, ChevronLeft, ChevronRight, RotateCcw, Camera } from 'lucide-react';
import type { StockSnapshot, ScheduleItem } from '../types';
import { getDateRange, formatDisplayDate, formatDate } from '../utils/historyUtils';
import { sortScheduleByTime } from '../utils/scheduleUtils';

interface HistoryTimelineProps {
  snapshots: StockSnapshot[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  onBackToCurrent: () => void;
  onSaveSnapshot?: () => void;
}

const statusConfig = {
  pending: { icon: Circle, color: 'bg-gray-200 text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  in_progress: { icon: PlayCircle, color: 'bg-blue-200 text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  completed: { icon: CheckCircle2, color: 'bg-green-200 text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  overdue: { icon: AlertTriangle, color: 'bg-red-200 text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
};

export default function HistoryTimeline({
  snapshots,
  selectedDate,
  onDateSelect,
  onBackToCurrent,
  onSaveSnapshot,
}: HistoryTimelineProps) {
  const [pageOffset, setPageOffset] = useState(0);
  const daysPerPage = 7;

  const availableDates = useMemo(() => {
    const allDates = getDateRange(14);
    const snapshotDates = new Set(snapshots.map(s => s.date));
    return allDates.filter(date => snapshotDates.has(date) || date === formatDate(new Date()));
  }, [snapshots]);

  const pagedDates = useMemo(() => {
    const start = pageOffset * daysPerPage;
    return availableDates.slice(start, start + daysPerPage);
  }, [availableDates, pageOffset]);

  const selectedSnapshot = useMemo(() => {
    if (!selectedDate) return null;
    return snapshots.find(s => s.date === selectedDate) || null;
  }, [snapshots, selectedDate]);

  const sortedSchedule = useMemo(() => {
    if (!selectedSnapshot) return [];
    return sortScheduleByTime(selectedSnapshot.schedule, '22:00');
  }, [selectedSnapshot]);

  const getStatsForDate = (date: string) => {
    const snapshot = snapshots.find(s => s.date === date);
    if (!snapshot) return null;
    const completed = snapshot.schedule.filter(s => s.status === 'completed').length;
    const total = snapshot.schedule.length;
    const totalQty = snapshot.schedule
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.quantity, 0);
    const lowStock = snapshot.products.filter(p => p.stock < p.maxStock * 0.3).length;
    return { completed, total, totalQty, lowStock, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getStatusStyle = (item: ScheduleItem) => {
    if (item.isOverdue && item.status === 'pending') {
      return statusConfig.overdue;
    }
    return statusConfig[item.status];
  };

  const totalPages = Math.ceil(availableDates.length / daysPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">补货记录回溯</h2>
        </div>
        <div className="flex items-center gap-2">
          {onSaveSnapshot && (
            <button
              onClick={onSaveSnapshot}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Camera className="w-4 h-4" />
              保存当前快照
            </button>
          )}
          {selectedDate && (
            <button
              onClick={onBackToCurrent}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              返回当前
            </button>
          )}
        </div>
      </div>

      {selectedDate && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 text-indigo-700">
            <Clock3 className="w-4 h-4" />
            <span className="text-sm font-medium">
              当前查看：{formatDisplayDate(selectedDate)} 的库存与排程快照
            </span>
            {selectedSnapshot && (
              <span className="text-xs text-indigo-500 ml-auto">
                快照时间: {new Date(selectedSnapshot.snapshotTime).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">选择日期查看历史快照</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPageOffset(Math.max(0, pageOffset - 1))}
              disabled={pageOffset === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 w-12 text-center">
              {pageOffset + 1}/{Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPageOffset(Math.min(totalPages - 1, pageOffset + 1))}
              disabled={pageOffset >= totalPages - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {pagedDates.map((date) => {
            const stats = getStatsForDate(date);
            const isToday = date === formatDate(new Date());
            const isSelected = selectedDate === date;
            const hasSnapshot = !!stats;

            return (
              <button
                key={date}
                onClick={() => hasSnapshot && onDateSelect(isSelected ? null : date)}
                disabled={!hasSnapshot}
                className={`relative p-2 rounded-lg border-2 transition-all text-center ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : hasSnapshot
                    ? 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className={`text-xs font-medium ${
                  isToday ? 'text-blue-600' : isSelected ? 'text-indigo-700' : 'text-gray-700'
                }`}>
                  {formatDisplayDate(date)}
                </div>
                {stats && (
                  <>
                    <div className="mt-1 text-lg font-bold text-gray-800">
                      {stats.completionRate}%
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {stats.completed}/{stats.total}完成
                    </div>
                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          stats.completionRate === 100 ? 'bg-green-500' :
                          stats.completionRate >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </>
                )}
                {!hasSnapshot && (
                  <div className="text-[10px] text-gray-400 mt-2">无快照</div>
                )}
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSnapshot && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {(() => {
              const stats = getStatsForDate(selectedDate!);
              if (!stats) return null;
              return (
                <>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-xs text-green-600">完成任务</div>
                    <div className="text-xl font-bold text-green-700">{stats.completed}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-xs text-blue-600">总任务数</div>
                    <div className="text-xl font-bold text-blue-700">{stats.total}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <div className="text-xs text-purple-600">补货总量</div>
                    <div className="text-xl font-bold text-purple-700">{stats.totalQty}</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <div className="text-xs text-orange-600">库存紧张</div>
                    <div className="text-xl font-bold text-orange-700">{stats.lowStock}</div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">当日排程详情</span>
            </div>
            <div className="relative">
              <div className="absolute left-[26px] top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {sortedSchedule.map((item, index) => {
                  const StatusIcon = item.isOverdue && item.status === 'pending'
                    ? AlertTriangle
                    : statusConfig[item.status].icon;
                  const style = getStatusStyle(item);
                  const isRescheduled = item.estimatedStartTime && item.time !== item.originalTime;

                  return (
                    <div
                      key={item.id}
                      className={`relative pl-14 ${index === sortedSchedule.length - 1 ? 'pb-0' : ''}`}
                    >
                      <div className="absolute left-0 w-14 h-14 flex items-center justify-center">
                        <div className={`p-2.5 rounded-full ${style.bg} border-2 ${style.border}`}>
                          <StatusIcon className={`w-4 h-4 ${
                            item.isOverdue && item.status === 'pending'
                              ? 'text-red-600'
                              : statusConfig[item.status].color.replace('bg-', 'text-').replace('-200', '-600')
                          }`} />
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${style.border} ${style.bg}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-gray-800">{item.time}</span>
                              {isRescheduled && (
                                <span className="text-xs text-gray-500 line-through">{item.originalTime}</span>
                              )}
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                item.isOverdue && item.status === 'pending'
                                  ? 'bg-red-200 text-red-700'
                                  : statusConfig[item.status].color
                              }`}>
                                {item.isOverdue && item.status === 'pending' ? '已逾期' :
                                 item.status === 'pending' ? '待补货' :
                                 item.status === 'in_progress' ? '补货中' : '已完成'}
                              </span>
                              {isRescheduled && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                  <Clock3 className="w-3 h-3" />
                                  已重排
                                </span>
                              )}
                            </div>
                            <h3 className="text-gray-700 mt-1 font-medium text-sm">{item.productName}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              <span>补货: <span className="font-semibold text-gray-700">{item.quantity}</span></span>
                              <span>耗时: <span className="font-semibold text-gray-700">{item.estimatedDuration}分钟</span></span>
                              {item.actualStartTime && (
                                <span>开始: <span className="font-semibold text-blue-600">{item.actualStartTime}</span></span>
                              )}
                              {item.actualEndTime && (
                                <span>完成: <span className="font-semibold text-green-600">{item.actualEndTime}</span></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedSnapshot && !selectedDate && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm">点击上方日期查看当日补货记录与库存快照</p>
        </div>
      )}
    </div>
  );
}
