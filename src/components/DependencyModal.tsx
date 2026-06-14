import { useState, useEffect } from 'react';
import { X, Link2, Check, AlertCircle } from 'lucide-react';
import type { ScheduleItem } from '../types';

interface DependencyModalProps {
  isOpen: boolean;
  task: ScheduleItem | null;
  allTasks: ScheduleItem[];
  onClose: () => void;
  onSave: (taskId: string, prerequisiteIds: string[]) => void;
}

export default function DependencyModal({ isOpen, task, allTasks, onClose, onSave }: DependencyModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setSelectedIds(task.prerequisiteIds || []);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const availableTasks = allTasks.filter(t => t.id !== task.id);

  const togglePrerequisite = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(task.id, selectedIds);
    onClose();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return { text: '已完成', color: 'bg-green-100 text-green-700' };
      case 'in_progress': return { text: '进行中', color: 'bg-blue-100 text-blue-700' };
      default: return { text: '待处理', color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">设置前置依赖</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">当前任务</p>
                <p className="text-sm text-blue-600">{task.productName}</p>
                <p className="text-xs text-blue-500 mt-1">计划时间: {task.originalTime}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            选择需要先完成的前置任务。所有前置任务完成后，当前任务才会解锁。
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {availableTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>暂无其他任务</p>
              </div>
            ) : (
              availableTasks.map(t => {
                const isSelected = selectedIds.includes(t.id);
                const statusConfig = getStatusLabel(t.status);
                return (
                  <div
                    key={t.id}
                    onClick={() => togglePrerequisite(t.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{t.productName}</p>
                          <p className="text-xs text-gray-500">计划时间: {t.originalTime}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
