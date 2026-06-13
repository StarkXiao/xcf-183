import { Clock, CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import type { ScheduleItem } from '../types';

interface ScheduleTimelineProps {
  schedule: ScheduleItem[];
  onStatusChange: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
}

const statusConfig = {
  pending: { icon: Circle, color: 'bg-gray-200 text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  in_progress: { icon: PlayCircle, color: 'bg-blue-200 text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  completed: { icon: CheckCircle2, color: 'bg-green-200 text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
};

export default function ScheduleTimeline({ schedule, onStatusChange }: ScheduleTimelineProps) {
  const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

  const getNextStatus = (current: 'pending' | 'in_progress' | 'completed') => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">时间轴排程</h2>
      </div>

      <div className="relative">
        <div className="absolute left-[26px] top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {sortedSchedule.map((item, index) => {
            const StatusIcon = statusConfig[item.status].icon;
            const nextStatus = getNextStatus(item.status);

            return (
              <div
                key={item.id}
                className={`relative pl-14 group ${
                  index === sortedSchedule.length - 1 ? 'pb-0' : ''
                }`}
              >
                <div
                  className={`absolute left-0 w-14 h-14 flex items-center justify-center cursor-pointer transition-transform hover:scale-110`}
                  onClick={() => onStatusChange(item.id, nextStatus)}
                >
                  <div className={`p-3 rounded-full ${statusConfig[item.status].bg} border-2 ${statusConfig[item.status].border}`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig[item.status].color.replace('bg-', 'text-').replace('-200', '-600')}`} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${statusConfig[item.status].border} ${statusConfig[item.status].bg} transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-800">{item.time}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[item.status].color}`}>
                          {item.status === 'pending' ? '待补货' : item.status === 'in_progress' ? '补货中' : '已完成'}
                        </span>
                      </div>
                      <h3 className="text-gray-700 mt-1">{item.productName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>补货数量: <span className="font-semibold text-gray-700">{item.quantity}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => onStatusChange(item.id, nextStatus)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:opacity-80"
                      style={{
                        backgroundColor: item.status === 'completed' ? '#f3f4f6' : '#3b82f6',
                        color: item.status === 'completed' ? '#6b7280' : 'white',
                      }}
                    >
                      {item.status === 'pending' ? '开始' : item.status === 'in_progress' ? '完成' : '重置'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
