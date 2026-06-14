import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  FileText,
  ListChecks,
  PenTool,
  X,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Flag,
  ShieldCheck,
  Eye,
  Edit3,
} from 'lucide-react';
import type {
  ShiftHandoverLog,
  HandoverEventType,
  HandoverTodoPriority,
  HandoverTodoStatus,
  HandoverExceptionSeverity,
} from '../types';
import {
  EVENT_TYPE_OPTIONS,
  TODO_PRIORITY_OPTIONS,
  EXCEPTION_SEVERITY_OPTIONS,
  EXCEPTION_CATEGORIES,
  getEventTypeLabel,
  getEventTypeColor,
  getPriorityLabel,
  getPriorityColor,
  getSeverityLabel,
  getSeverityColor,
  getStatusLabel,
  getStatusColor,
  getTodoStatusLabel,
  getTodoStatusColor,
  createHandoverEvent,
  createHandoverTodo,
  createHandoverException,
  createShiftHandoverLog,
  addEventToLog,
  addTodoToLog,
  addExceptionToLog,
  updateTodoInLog,
  removeEventFromLog,
  removeTodoFromLog,
  removeExceptionFromLog,
  signOutgoing,
  signIncoming,
  calculateHandoverStats,
} from '../utils/handoverUtils';
import { formatDate } from '../utils/historyUtils';

interface ShiftHandoverLogProps {
  logs: ShiftHandoverLog[];
  onUpdateLogs: (logs: ShiftHandoverLog[]) => void;
  currentTime: string;
}

type SubTab = 'events' | 'todos' | 'exceptions' | 'signature';

function AddEventModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (type: HandoverEventType, description: string, resolved: boolean, resolution?: string) => void;
}) {
  const [type, setType] = useState<HandoverEventType>('normal');
  const [description, setDescription] = useState('');
  const [resolved, setResolved] = useState(false);
  const [resolution, setResolution] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSubmit(type, description.trim(), resolved, resolved && resolution.trim() ? resolution.trim() : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">添加事件记录</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">事件类型</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    type === opt.value
                      ? `${opt.color} border-current font-medium`
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">事件描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请描述事件详情..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">是否已解决</label>
            <button
              onClick={() => setResolved(!resolved)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                resolved
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {resolved ? '已解决' : '未解决'}
            </button>
          </div>
          {resolved && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="请描述处理结果..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTodoModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (description: string, priority: HandoverTodoPriority, assignedTo?: string, dueBy?: string, notes?: string) => void;
}) {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<HandoverTodoPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueBy, setDueBy] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSubmit(description.trim(), priority, assignedTo.trim() || undefined, dueBy.trim() || undefined, notes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800">添加待办事项</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">待办描述</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请输入待办事项..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <div className="flex gap-2">
              {TODO_PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    priority === opt.value
                      ? `${opt.color} border-current font-medium`
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">指派给</label>
              <input
                type="text"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                placeholder="接班人姓名"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止时间</label>
              <input
                type="text"
                value={dueBy}
                onChange={e => setDueBy(e.target.value)}
                placeholder="如: 08:30"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="补充说明..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

function AddExceptionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (severity: HandoverExceptionSeverity, category: string, description: string, actionTaken?: string, followUpRequired?: boolean, followUpNotes?: string) => void;
}) {
  const [severity, setSeverity] = useState<HandoverExceptionSeverity>('warning');
  const [category, setCategory] = useState(EXCEPTION_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSubmit(severity, category, description.trim(), actionTaken.trim() || undefined, followUpRequired, followUpNotes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800">添加异常备注</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <div className="flex gap-2">
              {EXCEPTION_SEVERITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSeverity(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    severity === opt.value
                      ? `${opt.color} border-current font-medium`
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常类别</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {EXCEPTION_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请描述异常情况..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">已采取措施</label>
            <textarea
              value={actionTaken}
              onChange={e => setActionTaken(e.target.value)}
              placeholder="已采取的应急措施..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">需要后续跟进</label>
              <button
                onClick={() => setFollowUpRequired(!followUpRequired)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                  followUpRequired
                    ? 'bg-orange-50 border-orange-500 text-orange-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {followUpRequired ? '是' : '否'}
              </button>
            </div>
            {followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跟进说明</label>
                <textarea
                  value={followUpNotes}
                  onChange={e => setFollowUpNotes(e.target.value)}
                  placeholder="跟进要求说明..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

function SignaturePad({
  role,
  signerName,
  onSign,
  onClear,
  signedAt,
  disabled,
}: {
  role: 'outgoing' | 'incoming';
  signerName: string;
  onSign: (name: string) => void;
  onClear: () => void;
  signedAt?: string;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [localName, setLocalName] = useState(signerName);
  const hasSigned = !!signedAt;

  const getCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || hasSigned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [disabled, hasSigned, getCoordinates]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || hasSigned) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, disabled, hasSigned, getCoordinates]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  }, [onClear]);

  const handleConfirmSign = useCallback(() => {
    if (!localName.trim()) return;
    onSign(localName.trim());
  }, [localName, onSign]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
  }, []);

  const roleLabel = role === 'outgoing' ? '交班人' : '接班人';
  const roleColor = role === 'outgoing' ? 'blue' : 'purple';

  return (
    <div className={`rounded-xl border-2 ${hasSigned ? 'border-green-200 bg-green-50/30' : `border-${roleColor}-200 bg-${roleColor}-50/20`} p-4 transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool className={`w-4 h-4 ${hasSigned ? 'text-green-600' : `text-${roleColor}-600`}`} />
          <span className="font-medium text-gray-800">{roleLabel}签名</span>
          {hasSigned && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              <CheckCircle className="w-3 h-3" />
              已签名
            </span>
          )}
        </div>
        {hasSigned && <span className="text-xs text-gray-500">签名时间: {signedAt}</span>}
      </div>

      {!hasSigned && (
        <>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">签名姓名</label>
            <input
              type="text"
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              disabled={disabled}
              placeholder="请输入姓名"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">手写签名</label>
            <div className="border border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                style={{ height: '100px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={disabled}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              清除签名
            </button>
            <button
              onClick={handleConfirmSign}
              disabled={disabled || !localName.trim()}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认签名
            </button>
          </div>
        </>
      )}

      {hasSigned && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="font-medium">{signerName}</span>
          <span className="text-gray-400">({roleLabel})</span>
        </div>
      )}
    </div>
  );
}

function LogDetailModal({
  log,
  onClose,
}: {
  log: ShiftHandoverLog;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800">交接班日志详情</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-5">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">交班日期</span>
                <span className="font-medium text-gray-800">{log.shiftDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(log.status)}`}>
                  {getStatusLabel(log.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">交班人</span>
                <span className="text-gray-800">{log.outgoingOperator} ({log.outgoingShift})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">接班人</span>
                <span className="text-gray-800">{log.incomingOperator} ({log.incomingShift})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-700">{log.createdAt}</span>
              </div>
              {log.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">完成时间</span>
                  <span className="text-gray-700">{log.completedAt}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              事件记录 ({log.events.length})
            </h4>
            {log.events.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">暂无事件记录</p>
            ) : (
              <div className="space-y-2">
                {log.events.map(evt => (
                  <div key={evt.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${getEventTypeColor(evt.type)}`}>
                      {getEventTypeLabel(evt.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{evt.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{evt.occurredAt}</span>
                        <span>{evt.reportedBy}</span>
                        {evt.resolved ? (
                          <span className="text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />已解决</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />未解决</span>
                        )}
                      </div>
                      {evt.resolution && <p className="text-xs text-green-600 mt-1">处理结果: {evt.resolution}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-green-500" />
              待办事项 ({log.todos.length})
            </h4>
            {log.todos.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">暂无待办事项</p>
            ) : (
              <div className="space-y-2">
                {log.todos.map(todo => (
                  <div key={todo.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-green-50/50 border border-green-100">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${getPriorityColor(todo.priority)}`}>
                      {getPriorityLabel(todo.priority)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{todo.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${getTodoStatusColor(todo.status)}`}>
                          {getTodoStatusLabel(todo.status)}
                        </span>
                        {todo.assignedTo && <span>指派: {todo.assignedTo}</span>}
                        {todo.dueBy && <span>截止: {todo.dueBy}</span>}
                      </div>
                      {todo.notes && <p className="text-xs text-gray-500 mt-1">备注: {todo.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              异常备注 ({log.exceptions.length})
            </h4>
            {log.exceptions.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">暂无异常备注</p>
            ) : (
              <div className="space-y-2">
                {log.exceptions.map(exc => (
                  <div key={exc.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-orange-50/50 border border-orange-100">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${getSeverityColor(exc.severity)}`}>
                      {getSeverityLabel(exc.severity)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{exc.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{exc.category}</span>
                        <span>{exc.occurredAt}</span>
                        <span>{exc.reportedBy}</span>
                      </div>
                      {exc.actionTaken && <p className="text-xs text-green-600 mt-1">已采取措施: {exc.actionTaken}</p>}
                      {exc.followUpRequired && <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />需后续跟进{exc.followUpNotes ? `: ${exc.followUpNotes}` : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {log.generalNotes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">综合备注</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{log.generalNotes}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-indigo-500" />
              签名确认
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 text-center ${log.outgoingSignature ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">交班人</p>
                {log.outgoingSignature ? (
                  <>
                    <p className="font-medium text-gray-800">{log.outgoingSignature.signerName}</p>
                    <p className="text-xs text-gray-500 mt-1">{log.outgoingSignature.signedAt}</p>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">未签名</p>
                )}
              </div>
              <div className={`rounded-lg p-3 text-center ${log.incomingSignature ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">接班人</p>
                {log.incomingSignature ? (
                  <>
                    <p className="font-medium text-gray-800">{log.incomingSignature.signerName}</p>
                    <p className="text-xs text-gray-500 mt-1">{log.incomingSignature.signedAt}</p>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">未签名</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShiftHandoverLogComponent({ logs, onUpdateLogs }: ShiftHandoverLogProps) {
  const [subTab, setSubTab] = useState<SubTab>('events');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddException, setShowAddException] = useState(false);
  const [detailLog, setDetailLog] = useState<ShiftHandoverLog | null>(null);
  const [showNewLogForm, setShowNewLogForm] = useState(false);
  const [newLogOutgoing, setNewLogOutgoing] = useState('张夜班');
  const [newLogIncoming, setNewLogIncoming] = useState('李早班');
  const [generalNotes, setGeneralNotes] = useState(() => {
    const log = logs.find(l => l.status !== 'completed') ?? logs[0];
    return log?.generalNotes ?? '';
  });

  const selectedLog = useMemo(() => {
    if (!selectedLogId) return logs.find(l => l.status !== 'completed') ?? logs[0] ?? null;
    return logs.find(l => l.id === selectedLogId) ?? null;
  }, [logs, selectedLogId]);

  const stats = useMemo(() => calculateHandoverStats(logs), [logs]);

  const draftLog = useMemo(() => logs.find(l => l.status !== 'completed') ?? null, [logs]);

  const updateLog = useCallback((updatedLog: ShiftHandoverLog) => {
    onUpdateLogs(logs.map(l => (l.id === updatedLog.id ? updatedLog : l)));
  }, [logs, onUpdateLogs]);

  const handleAddEvent = useCallback((type: HandoverEventType, description: string, resolved: boolean, resolution?: string) => {
    if (!selectedLog) return;
    const event = createHandoverEvent(type, description, selectedLog.outgoingOperator, resolved, resolution);
    updateLog(addEventToLog(selectedLog, event));
    setShowAddEvent(false);
  }, [selectedLog, updateLog]);

  const handleAddTodo = useCallback((description: string, priority: HandoverTodoPriority, assignedTo?: string, dueBy?: string, notes?: string) => {
    if (!selectedLog) return;
    const todo = createHandoverTodo(description, priority, assignedTo, dueBy, notes);
    updateLog(addTodoToLog(selectedLog, todo));
    setShowAddTodo(false);
  }, [selectedLog, updateLog]);

  const handleAddException = useCallback((severity: HandoverExceptionSeverity, category: string, description: string, actionTaken?: string, followUpRequired?: boolean, followUpNotes?: string) => {
    if (!selectedLog) return;
    const exception = createHandoverException(severity, category, description, selectedLog.outgoingOperator, actionTaken, followUpRequired, followUpNotes);
    updateLog(addExceptionToLog(selectedLog, exception));
    setShowAddException(false);
  }, [selectedLog, updateLog]);

  const handleRemoveEvent = useCallback((eventId: string) => {
    if (!selectedLog || selectedLog.status === 'completed') return;
    updateLog(removeEventFromLog(selectedLog, eventId));
  }, [selectedLog, updateLog]);

  const handleRemoveTodo = useCallback((todoId: string) => {
    if (!selectedLog || selectedLog.status === 'completed') return;
    updateLog(removeTodoFromLog(selectedLog, todoId));
  }, [selectedLog, updateLog]);

  const handleRemoveException = useCallback((exceptionId: string) => {
    if (!selectedLog || selectedLog.status === 'completed') return;
    updateLog(removeExceptionFromLog(selectedLog, exceptionId));
  }, [selectedLog, updateLog]);

  const handleUpdateTodoStatus = useCallback((todoId: string, status: HandoverTodoStatus) => {
    if (!selectedLog) return;
    updateLog(updateTodoInLog(selectedLog, todoId, { status }));
  }, [selectedLog, updateLog]);

  const handleSignOutgoing = useCallback(() => {
    if (!selectedLog) return;
    updateLog(signOutgoing(selectedLog, selectedLog.outgoingOperator));
  }, [selectedLog, updateLog]);

  const handleSignIncoming = useCallback(() => {
    if (!selectedLog) return;
    updateLog(signIncoming(selectedLog, selectedLog.incomingOperator));
  }, [selectedLog, updateLog]);

  const handleClearOutgoingSignature = useCallback(() => {
    if (!selectedLog) return;
    updateLog({ ...selectedLog, outgoingSignature: undefined, status: 'draft' as const, completedAt: undefined });
  }, [selectedLog, updateLog]);

  const handleClearIncomingSignature = useCallback(() => {
    if (!selectedLog) return;
    updateLog({ ...selectedLog, incomingSignature: undefined, status: selectedLog.outgoingSignature ? 'pending_signature' as const : 'draft' as const, completedAt: undefined });
  }, [selectedLog, updateLog]);

  const handleUpdateGeneralNotes = useCallback(() => {
    if (!selectedLog) return;
    updateLog({ ...selectedLog, generalNotes });
  }, [selectedLog, generalNotes, updateLog]);

  const handleCreateNewLog = useCallback(() => {
    const newLog = createShiftHandoverLog(
      formatDate(new Date()),
      '夜班',
      '早班',
      newLogOutgoing.trim() || '张夜班',
      newLogIncoming.trim() || '李早班',
    );
    onUpdateLogs([newLog, ...logs]);
    setSelectedLogId(newLog.id);
    setGeneralNotes('');
    setShowNewLogForm(false);
  }, [logs, newLogOutgoing, newLogIncoming, onUpdateLogs]);

  const isCompleted = selectedLog?.status === 'completed';

  const statCards = [
    { icon: ClipboardList, label: '日志总数', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: FileText, label: '未解决事件', value: stats.unresolvedEvents, color: 'text-red-600', bg: 'bg-red-50' },
    { icon: ListChecks, label: '待办事项', value: stats.pendingTodos, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: AlertOctagon, label: '严重异常', value: stats.criticalExceptions, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const subTabs: { key: SubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'events', label: '事件记录', icon: FileText },
    { key: 'todos', label: '待办移交', icon: ListChecks },
    { key: 'exceptions', label: '异常备注', icon: AlertTriangle },
    { key: 'signature', label: '签名确认', icon: PenTool },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 py-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedLog?.id ?? ''}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedLogId(id);
                  const targetLog = logs.find(l => l.id === id);
                  if (targetLog) setGeneralNotes(targetLog.generalNotes);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {logs.map(log => (
                  <option key={log.id} value={log.id}>
                    {log.shiftDate} {log.outgoingShift}→{log.incomingShift} ({log.outgoingOperator}→{log.incomingOperator}) - {getStatusLabel(log.status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex">
              {subTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSubTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors ${
                    subTab === tab.key
                      ? 'border-indigo-500 text-indigo-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'events' && selectedLog && selectedLog.events.filter(e => !e.resolved).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                      {selectedLog.events.filter(e => !e.resolved).length}
                    </span>
                  )}
                  {tab.key === 'todos' && selectedLog && selectedLog.todos.filter(t => t.status === 'pending').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      {selectedLog.todos.filter(t => t.status === 'pending').length}
                    </span>
                  )}
                  {tab.key === 'exceptions' && selectedLog && selectedLog.exceptions.filter(e => e.severity === 'critical').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                      {selectedLog.exceptions.filter(e => e.severity === 'critical').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedLog && (
              <button
                onClick={() => setDetailLog(selectedLog)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                查看完整日志
              </button>
            )}
            {!draftLog && (
              <button
                onClick={() => setShowNewLogForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
              >
                <Plus className="w-4 h-4" />
                新建交接日志
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {!selectedLog ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无交接班日志</p>
              <button
                onClick={() => setShowNewLogForm(true)}
                className="mt-3 px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
              >
                创建第一条日志
              </button>
            </div>
          ) : (
            <>
              {subTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      共 {selectedLog.events.length} 条事件，{selectedLog.events.filter(e => !e.resolved).length} 条未解决
                    </p>
                    {!isCompleted && (
                      <button
                        onClick={() => setShowAddEvent(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                        添加事件
                      </button>
                    )}
                  </div>
                  {selectedLog.events.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无事件记录，点击"添加事件"开始记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLog.events.map(evt => (
                        <div key={evt.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                          <div className="mt-0.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getEventTypeColor(evt.type)}`}>
                              {getEventTypeLabel(evt.type)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{evt.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{evt.occurredAt}</span>
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{evt.reportedBy}</span>
                              {evt.resolved ? (
                                <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />已解决</span>
                              ) : (
                                <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />未解决</span>
                              )}
                            </div>
                            {evt.resolution && (
                              <div className="mt-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                                处理结果: {evt.resolution}
                              </div>
                            )}
                          </div>
                          {!isCompleted && (
                            <button
                              onClick={() => handleRemoveEvent(evt.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTab === 'todos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      共 {selectedLog.todos.length} 项待办，{selectedLog.todos.filter(t => t.status === 'pending').length} 项待处理
                    </p>
                    {!isCompleted && (
                      <button
                        onClick={() => setShowAddTodo(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600"
                      >
                        <Plus className="w-4 h-4" />
                        添加待办
                      </button>
                    )}
                  </div>
                  {selectedLog.todos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无待办事项，点击"添加待办"创建移交任务</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLog.todos.map(todo => (
                        <div key={todo.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          todo.status === 'completed'
                            ? 'border-green-100 bg-green-50/30'
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        }`}>
                          <div className="mt-0.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                              {getPriorityLabel(todo.priority)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${todo.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                              {todo.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className={`px-1.5 py-0.5 rounded ${getTodoStatusColor(todo.status)}`}>
                                {getTodoStatusLabel(todo.status)}
                              </span>
                              {todo.assignedTo && (
                                <span className="flex items-center gap-1"><User className="w-3 h-3" />指派: {todo.assignedTo}</span>
                              )}
                              {todo.dueBy && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />截止: {todo.dueBy}</span>
                              )}
                            </div>
                            {todo.notes && (
                              <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">备注: {todo.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!isCompleted && todo.status !== 'completed' && (
                              <>
                                {todo.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateTodoStatus(todo.id, 'in_progress')}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                                    title="开始处理"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleUpdateTodoStatus(todo.id, 'completed')}
                                  className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-500 transition-colors"
                                  title="标记完成"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {!isCompleted && (
                              <button
                                onClick={() => handleRemoveTodo(todo.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTab === 'exceptions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      共 {selectedLog.exceptions.length} 条异常，{selectedLog.exceptions.filter(e => e.severity === 'critical').length} 条严重
                    </p>
                    {!isCompleted && (
                      <button
                        onClick={() => setShowAddException(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                        添加异常
                      </button>
                    )}
                  </div>
                  {selectedLog.exceptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无异常备注，点击"添加异常"记录</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLog.exceptions.map(exc => (
                        <div key={exc.id} className={`p-4 rounded-xl border transition-all ${
                          exc.severity === 'critical'
                            ? 'border-red-200 bg-red-50/30'
                            : exc.severity === 'warning'
                            ? 'border-yellow-200 bg-yellow-50/30'
                            : 'border-blue-200 bg-blue-50/30'
                        }`}>
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5">
                              {exc.severity === 'critical' ? (
                                <AlertOctagon className="w-5 h-5 text-red-500" />
                              ) : exc.severity === 'warning' ? (
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              ) : (
                                <Info className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getSeverityColor(exc.severity)}`}>
                                  {getSeverityLabel(exc.severity)}
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{exc.category}</span>
                                {exc.followUpRequired && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                    <Flag className="w-3 h-3" />需跟进
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-800">{exc.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exc.occurredAt}</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3" />{exc.reportedBy}</span>
                              </div>
                              {exc.actionTaken && (
                                <div className="mt-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                                  已采取措施: {exc.actionTaken}
                                </div>
                              )}
                              {exc.followUpRequired && exc.followUpNotes && (
                                <div className="mt-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5">
                                  跟进说明: {exc.followUpNotes}
                                </div>
                              )}
                            </div>
                            {!isCompleted && (
                              <button
                                onClick={() => handleRemoveException(exc.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTab === 'signature' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">综合备注</label>
                    <textarea
                      value={generalNotes}
                      onChange={e => setGeneralNotes(e.target.value)}
                      onBlur={handleUpdateGeneralNotes}
                      disabled={isCompleted}
                      placeholder="填写本次交接的整体情况说明..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SignaturePad
                      role="outgoing"
                      signerName={selectedLog.outgoingOperator}
                      onSign={handleSignOutgoing}
                      onClear={handleClearOutgoingSignature}
                      signedAt={selectedLog.outgoingSignature?.signedAt}
                      disabled={isCompleted}
                    />
                    <SignaturePad
                      role="incoming"
                      signerName={selectedLog.incomingOperator}
                      onSign={handleSignIncoming}
                      onClear={handleClearIncomingSignature}
                      signedAt={selectedLog.incomingSignature?.signedAt}
                      disabled={isCompleted}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" />
                      <h4 className="font-semibold text-gray-800">签名状态</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedLog.status)}`}>
                        {getStatusLabel(selectedLog.status)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          selectedLog.outgoingSignature ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {selectedLog.outgoingSignature ? <CheckCircle className="w-4 h-4" /> : <span>1</span>}
                        </div>
                        <span className={selectedLog.outgoingSignature ? 'text-green-700' : 'text-gray-500'}>
                          交班人签名 {selectedLog.outgoingSignature ? `✓ ${selectedLog.outgoingSignature.signerName} (${selectedLog.outgoingSignature.signedAt})` : '— 待签名'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          selectedLog.incomingSignature ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {selectedLog.incomingSignature ? <CheckCircle className="w-4 h-4" /> : <span>2</span>}
                        </div>
                        <span className={selectedLog.incomingSignature ? 'text-green-700' : 'text-gray-500'}>
                          接班人签名 {selectedLog.incomingSignature ? `✓ ${selectedLog.incomingSignature.signerName} (${selectedLog.incomingSignature.signedAt})` : '— 待签名'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 mx-auto rotate-90" />
                      <p className={`text-center text-sm ${selectedLog.status === 'completed' ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        {selectedLog.status === 'completed'
                          ? '交接班日志已完成确认'
                          : '双方签名完成后，交接班日志将自动确认完成'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddEvent && (
        <AddEventModal onClose={() => setShowAddEvent(false)} onSubmit={handleAddEvent} />
      )}
      {showAddTodo && (
        <AddTodoModal onClose={() => setShowAddTodo(false)} onSubmit={handleAddTodo} />
      )}
      {showAddException && (
        <AddExceptionModal onClose={() => setShowAddException(false)} onSubmit={handleAddException} />
      )}
      {detailLog && (
        <LogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />
      )}
      {showNewLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-800">新建交接班日志</h3>
              </div>
              <button onClick={() => setShowNewLogForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交班人姓名</label>
                <input
                  type="text"
                  value={newLogOutgoing}
                  onChange={e => setNewLogOutgoing(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">接班人姓名</label>
                <input
                  type="text"
                  value={newLogIncoming}
                  onChange={e => setNewLogIncoming(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowNewLogForm(false)} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleCreateNewLog} className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
