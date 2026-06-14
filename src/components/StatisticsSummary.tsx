import { useState, useMemo } from 'react';
import { BarChart3, Package, AlertTriangle, Clock, CheckCircle, ListTodo, AlertCircle, Clock3, Zap, AlertTriangle as AlertTriangleIcon, Bell, ChevronDown, ChevronUp, AlertOctagon } from 'lucide-react';
import type { Statistics, Product, ScheduleItem, TimeSlotStats } from '../types';
import { calculateTimeSlotStats } from '../utils/scheduleUtils';

interface StatisticsSummaryProps {
  statistics: Statistics;
  products: Product[];
  schedule: ScheduleItem[];
  currentTime: string;
}

const statConfig = [
  { key: 'totalProducts', label: '商品种类', icon: Package, color: 'bg-blue-500' },
  { key: 'totalStock', label: '总库存量', icon: BarChart3, color: 'bg-green-500' },
  { key: 'lowStockCount', label: '库存紧张', icon: AlertTriangle, color: 'bg-red-500' },
  { key: 'expiringCount', label: '临期商品', icon: Clock, color: 'bg-orange-500' },
  { key: 'scheduledTasks', label: '排程任务', icon: ListTodo, color: 'bg-purple-500' },
  { key: 'overdueTasks', label: '逾期任务', icon: AlertCircle, color: 'bg-red-600' },
  { key: 'completedTasks', label: '已完成', icon: CheckCircle, color: 'bg-teal-500' },
];

export default function StatisticsSummary({ statistics, products, schedule, currentTime }: StatisticsSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const completionRate = statistics.scheduledTasks > 0
    ? Math.round((statistics.completedTasks / statistics.scheduledTasks) * 100)
    : 0;

  const beverageCount = products.filter(p => p.category === 'beverage').length;
  const riceBallCount = products.filter(p => p.category === 'rice_ball').length;

  const timeSlotStats: TimeSlotStats[] = useMemo(() => {
    return calculateTimeSlotStats(schedule, currentTime);
  }, [schedule, currentTime]);

  const avgCompletionRate = useMemo(() => {
    const slotsWithTasks = timeSlotStats.filter(s => s.totalTasks > 0);
    if (slotsWithTasks.length === 0) return 0;
    return Math.round(slotsWithTasks.reduce((sum, s) => sum + s.completionRate, 0) / slotsWithTasks.length);
  }, [timeSlotStats]);

  const bottleneckCount = timeSlotStats.filter(s => s.isBottleneck).length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-800">统计摘要</h2>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {statConfig.map((stat) => (
          <div key={stat.key} className="text-center">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className={`text-2xl font-bold ${stat.key === 'overdueTasks' && statistics.overdueTasks > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {stat.key === 'totalStock' ? `${statistics[stat.key as keyof Statistics]}` : statistics[stat.key as keyof Statistics]}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {statistics.estimatedFinishTime && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">预计全部任务完成时间</p>
                <p className="text-xl font-bold text-blue-700">{statistics.estimatedFinishTime}</p>
              </div>
            </div>
            {statistics.overdueTasks > 0 && (
              <div className="text-right">
                <p className="text-xs text-red-600 font-medium">含 {statistics.overdueTasks} 个逾期任务</p>
                <p className="text-xs text-gray-500">后续任务已自动顺延</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">任务完成进度</span>
            {bottleneckCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                <AlertOctagon className="w-3 h-3" />
                {bottleneckCount} 个瓶颈时段
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-600">{completionRate}%</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          点击{expanded ? '收起' : '展开'}各时段完成率明细
        </p>
      </div>

      {expanded && (
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-indigo-500" />
              各时段完成率明细
            </h3>
            <div className="text-xs text-gray-500">
              平均完成率: <span className="font-semibold text-indigo-600">{avgCompletionRate}%</span>
            </div>
          </div>
          <div className="space-y-3">
            {timeSlotStats.map((slot) => (
              <div
                key={slot.timeSlot}
                className={`p-3 rounded-lg transition-all ${
                  slot.isBottleneck
                    ? 'bg-red-50 border border-red-200'
                    : slot.totalTasks > 0
                    ? 'bg-white border border-gray-100'
                    : 'bg-gray-50 border border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{slot.timeSlot}</span>
                    {slot.isBottleneck && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                        <AlertOctagon className="w-3 h-3" />
                        瓶颈
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      slot.isBottleneck ? 'text-red-600' : slot.totalTasks > 0 ? 'text-indigo-600' : 'text-gray-400'
                    }`}>
                      {slot.completionRate}%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {slot.completedTasks}/{slot.totalTasks} 任务
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      slot.isBottleneck
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : slot.totalTasks > 0
                        ? 'bg-gradient-to-r from-indigo-400 to-purple-500'
                        : 'bg-gray-300'
                    }`}
                    style={{ width: `${slot.totalTasks > 0 ? slot.completionRate : 0}%` }}
                  />
                </div>
                {slot.isBottleneck && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    低于平均完成率 {avgCompletionRate}%，需重点关注
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-400 to-purple-500"></span>
                正常时段
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gradient-to-r from-red-400 to-red-500"></span>
                瓶颈时段（低于平均值）
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">饮料</p>
              <p className="font-semibold text-blue-600">{beverageCount}</p>
            </div>
          </div>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">饭团/便当</p>
              <p className="font-semibold text-orange-600">{riceBallCount}</p>
            </div>
          </div>
        </div>
      </div>

      {statistics.expiringCount > 0 && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">临期商品分级</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-red-50 rounded-lg text-center border border-red-100">
              <div className="flex items-center justify-center mb-1">
                <Zap className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-600">{statistics.expiringCritical}</p>
              <p className="text-xs text-red-500">紧急(≤1天)</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-100">
              <div className="flex items-center justify-center mb-1">
                <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-lg font-bold text-orange-600">{statistics.expiringWarning}</p>
              <p className="text-xs text-orange-500">警告(≤3天)</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg text-center border border-yellow-100">
              <div className="flex items-center justify-center mb-1">
                <Bell className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-lg font-bold text-yellow-600">{statistics.expiringAttention}</p>
              <p className="text-xs text-yellow-600">提醒(≤7天)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
