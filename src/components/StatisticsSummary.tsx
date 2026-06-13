import { BarChart3, Package, AlertTriangle, Clock, CheckCircle, ListTodo, AlertCircle, Clock3 } from 'lucide-react';
import type { Statistics, Product } from '../types';

interface StatisticsSummaryProps {
  statistics: Statistics;
  products: Product[];
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

export default function StatisticsSummary({ statistics, products }: StatisticsSummaryProps) {
  const completionRate = statistics.scheduledTasks > 0 
    ? Math.round((statistics.completedTasks / statistics.scheduledTasks) * 100) 
    : 0;

  const beverageCount = products.filter(p => p.category === 'beverage').length;
  const riceBallCount = products.filter(p => p.category === 'rice_ball').length;

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

      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">任务完成进度</span>
          <span className="text-sm font-semibold text-indigo-600">{completionRate}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
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
    </div>
  );
}
