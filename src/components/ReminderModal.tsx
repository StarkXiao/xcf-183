import { useState, useEffect } from 'react';
import { Bell, Clock, X, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import type { Reminder } from '../types';
import { getExpiryWarningConfig } from '../utils/expiryUtils';

interface ReminderModalProps {
  reminders: Reminder[];
  onDismiss: (id: string) => void;
}

const expiryLevelIcons = {
  critical: Zap,
  warning: AlertTriangle,
  attention: AlertCircle,
};

const typeConfig = {
  low_stock: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: '库存告警' },
  expiring: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: '临期提醒' },
  scheduled: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: '排程提醒' },
  overdue: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', label: '逾期催办' },
};

const getReminderStyle = (reminder: Reminder) => {
  if (reminder.type === 'expiring' && reminder.expiryLevel) {
    const expiryConfig = getExpiryWarningConfig(reminder.expiryLevel);
    const ExpiryIcon = expiryLevelIcons[reminder.expiryLevel];
    return {
      icon: ExpiryIcon,
      color: expiryConfig.color,
      bg: expiryConfig.bg,
      border: expiryConfig.border,
      label: expiryConfig.label,
      suggestion: expiryConfig.suggestion,
      action: expiryConfig.action,
    };
  }
  const config = typeConfig[reminder.type];
  return {
    icon: config.icon,
    color: config.color,
    bg: config.bg,
    border: config.border,
    label: config.label,
    suggestion: null,
    action: null,
  };
};

export default function ReminderModal({ reminders, onDismiss }: ReminderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (reminders.length > 0) {
      setIsOpen(true);
      setCurrentReminder(reminders[0]);
    }
  }, [reminders]);

  const handleNext = () => {
    if (!currentReminder) return;
    const currentIndex = reminders.findIndex(r => r.id === currentReminder.id);
    if (currentIndex < reminders.length - 1) {
      setCurrentReminder(reminders[currentIndex + 1]);
    } else {
      setShowAll(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentReminder(null);
    setShowAll(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">提醒通知</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {showAll ? (
          <div className="p-4">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {reminders.map((reminder) => {
                const style = getReminderStyle(reminder);
                const TypeIcon = style.icon;
                return (
                  <div
                    key={reminder.id}
                    className={`p-4 rounded-lg border ${style.border} ${style.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${style.bg}`}>
                        <TypeIcon className={`w-5 h-5 ${style.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-gray-400">{reminder.time}</span>
                        </div>
                        <h4 className="font-medium text-gray-800 mt-1">{reminder.productName}</h4>
                        <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                        {style.suggestion && (
                          <p className={`text-xs mt-2 ${style.color} font-medium`}>
                            💡 {style.suggestion}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onDismiss(reminder.id)}
                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleClose}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              全部已读
            </button>
          </div>
        ) : currentReminder ? (
          <div className="p-6">
            {(() => {
              const style = getReminderStyle(currentReminder);
              const TypeIcon = style.icon;
              return (
                <>
                  <div className={`w-16 h-16 rounded-full ${style.bg} flex items-center justify-center mx-auto mb-4`}>
                    <TypeIcon className={`w-8 h-8 ${style.color}`} />
                  </div>
                  
                  <div className="text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{currentReminder.productName}</h4>
                    <p className="text-gray-600">{currentReminder.message}</p>
                    <p className="text-sm text-gray-400 mt-2">{currentReminder.time}</p>
                  </div>

                  {style.suggestion && (
                    <div className={`mt-4 p-3 rounded-lg ${style.bg} border ${style.border}`}>
                      <p className={`text-sm ${style.color}`}>
                        <span className="font-semibold">操作建议：</span>
                        {style.suggestion}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      稍后处理
                    </button>
                    <button
                      onClick={handleNext}
                      className={`flex-1 py-2.5 font-medium rounded-lg transition-colors ${
                        style.suggestion 
                          ? `${style.bg} ${style.color} hover:opacity-90` 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reminders.findIndex(r => r.id === currentReminder.id) < reminders.length - 1 ? '下一条' : '查看全部'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </div>
    </div>
  );
}
