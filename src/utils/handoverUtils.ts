import type {
  ShiftHandoverLog,
  HandoverEvent,
  HandoverEventType,
  HandoverTodo,
  HandoverTodoPriority,
  HandoverTodoStatus,
  HandoverException,
  HandoverExceptionSeverity,
  ElectronicSignature,
  HandoverLogStatus,
} from '../types';
import { getCurrentTime } from './scheduleUtils';

export const EVENT_TYPE_OPTIONS: { value: HandoverEventType; label: string; color: string }[] = [
  { value: 'normal', label: '常规', color: 'bg-gray-100 text-gray-700' },
  { value: 'incident', label: '突发事件', color: 'bg-red-100 text-red-700' },
  { value: 'equipment', label: '设备故障', color: 'bg-orange-100 text-orange-700' },
  { value: 'customer', label: '客诉事件', color: 'bg-purple-100 text-purple-700' },
  { value: 'safety', label: '安全隐患', color: 'bg-red-100 text-red-800' },
  { value: 'other', label: '其他', color: 'bg-blue-100 text-blue-700' },
];

export const TODO_PRIORITY_OPTIONS: { value: HandoverTodoPriority; label: string; color: string }[] = [
  { value: 'high', label: '紧急', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: '重要', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: '一般', color: 'bg-green-100 text-green-700' },
];

export const EXCEPTION_SEVERITY_OPTIONS: { value: HandoverExceptionSeverity; label: string; color: string }[] = [
  { value: 'critical', label: '严重', color: 'bg-red-100 text-red-700' },
  { value: 'warning', label: '警告', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'info', label: '提示', color: 'bg-blue-100 text-blue-700' },
];

export const EXCEPTION_CATEGORIES = [
  '库存异常',
  '设备故障',
  '温度异常',
  '现金差异',
  '商品质量',
  '安全隐患',
  '人员问题',
  '其他',
];

export const getEventTypeLabel = (type: HandoverEventType): string => {
  return EVENT_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type;
};

export const getEventTypeColor = (type: HandoverEventType): string => {
  return EVENT_TYPE_OPTIONS.find(o => o.value === type)?.color ?? 'bg-gray-100 text-gray-700';
};

export const getPriorityLabel = (priority: HandoverTodoPriority): string => {
  return TODO_PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? priority;
};

export const getPriorityColor = (priority: HandoverTodoPriority): string => {
  return TODO_PRIORITY_OPTIONS.find(o => o.value === priority)?.color ?? 'bg-gray-100 text-gray-700';
};

export const getSeverityLabel = (severity: HandoverExceptionSeverity): string => {
  return EXCEPTION_SEVERITY_OPTIONS.find(o => o.value === severity)?.label ?? severity;
};

export const getSeverityColor = (severity: HandoverExceptionSeverity): string => {
  return EXCEPTION_SEVERITY_OPTIONS.find(o => o.value === severity)?.color ?? 'bg-gray-100 text-gray-700';
};

export const getStatusLabel = (status: HandoverLogStatus): string => {
  const map: Record<HandoverLogStatus, string> = {
    draft: '草稿',
    pending_signature: '待签名',
    completed: '已完成',
  };
  return map[status];
};

export const getStatusColor = (status: HandoverLogStatus): string => {
  const map: Record<HandoverLogStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    pending_signature: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
  };
  return map[status];
};

export const getTodoStatusLabel = (status: HandoverTodoStatus): string => {
  const map: Record<HandoverTodoStatus, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
  };
  return map[status];
};

export const getTodoStatusColor = (status: HandoverTodoStatus): string => {
  const map: Record<HandoverTodoStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };
  return map[status];
};

export const createHandoverEvent = (
  type: HandoverEventType,
  description: string,
  reportedBy: string,
  resolved: boolean = false,
  resolution?: string,
): HandoverEvent => ({
  id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  description,
  occurredAt: getCurrentTime(),
  reportedBy,
  resolved,
  resolution,
});

export const createHandoverTodo = (
  description: string,
  priority: HandoverTodoPriority,
  assignedTo?: string,
  dueBy?: string,
  notes?: string,
): HandoverTodo => ({
  id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  description,
  priority,
  status: 'pending',
  assignedTo,
  dueBy,
  notes,
});

export const createHandoverException = (
  severity: HandoverExceptionSeverity,
  category: string,
  description: string,
  reportedBy: string,
  actionTaken?: string,
  followUpRequired: boolean = false,
  followUpNotes?: string,
): HandoverException => ({
  id: `exc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  severity,
  category,
  description,
  occurredAt: getCurrentTime(),
  reportedBy,
  actionTaken,
  followUpRequired,
  followUpNotes,
});

export const createSignature = (name: string, role: string): ElectronicSignature => ({
  signerName: name,
  signerRole: role,
  signedAt: getCurrentTime(),
  signatureData: `SIG-${name}-${Date.now()}`,
});

export const createShiftHandoverLog = (
  shiftDate: string,
  outgoingShift: string,
  incomingShift: string,
  outgoingOperator: string,
  incomingOperator: string,
): ShiftHandoverLog => ({
  id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  shiftDate,
  outgoingShift,
  incomingShift,
  outgoingOperator,
  incomingOperator,
  events: [],
  todos: [],
  exceptions: [],
  generalNotes: '',
  status: 'draft',
  createdAt: getCurrentTime(),
});

export const signOutgoing = (log: ShiftHandoverLog, operator: string): ShiftHandoverLog => {
  const signature = createSignature(operator, '交班人');
  const newStatus: HandoverLogStatus = log.incomingSignature ? 'completed' : 'pending_signature';
  return {
    ...log,
    outgoingSignature: signature,
    status: newStatus,
    completedAt: newStatus === 'completed' ? getCurrentTime() : undefined,
  };
};

export const signIncoming = (log: ShiftHandoverLog, operator: string): ShiftHandoverLog => {
  const signature = createSignature(operator, '接班人');
  const newStatus: HandoverLogStatus = log.outgoingSignature ? 'completed' : 'pending_signature';
  return {
    ...log,
    incomingSignature: signature,
    status: newStatus,
    completedAt: newStatus === 'completed' ? getCurrentTime() : undefined,
  };
};

export const addEventToLog = (log: ShiftHandoverLog, event: HandoverEvent): ShiftHandoverLog => ({
  ...log,
  events: [...log.events, event],
});

export const addTodoToLog = (log: ShiftHandoverLog, todo: HandoverTodo): ShiftHandoverLog => ({
  ...log,
  todos: [...log.todos, todo],
});

export const addExceptionToLog = (log: ShiftHandoverLog, exception: HandoverException): ShiftHandoverLog => ({
  ...log,
  exceptions: [...log.exceptions, exception],
});

export const updateTodoInLog = (log: ShiftHandoverLog, todoId: string, updates: Partial<HandoverTodo>): ShiftHandoverLog => ({
  ...log,
  todos: log.todos.map(t => (t.id === todoId ? { ...t, ...updates } : t)),
});

export const removeEventFromLog = (log: ShiftHandoverLog, eventId: string): ShiftHandoverLog => ({
  ...log,
  events: log.events.filter(e => e.id !== eventId),
});

export const removeTodoFromLog = (log: ShiftHandoverLog, todoId: string): ShiftHandoverLog => ({
  ...log,
  todos: log.todos.filter(t => t.id !== todoId),
});

export const removeExceptionFromLog = (log: ShiftHandoverLog, exceptionId: string): ShiftHandoverLog => ({
  ...log,
  exceptions: log.exceptions.filter(e => e.id !== exceptionId),
});

export const calculateHandoverStats = (logs: ShiftHandoverLog[]) => {
  const total = logs.length;
  const draft = logs.filter(l => l.status === 'draft').length;
  const pendingSignature = logs.filter(l => l.status === 'pending_signature').length;
  const completed = logs.filter(l => l.status === 'completed').length;
  const totalEvents = logs.reduce((sum, l) => sum + l.events.length, 0);
  const unresolvedEvents = logs.reduce(
    (sum, l) => sum + l.events.filter(e => !e.resolved).length, 0
  );
  const pendingTodos = logs.reduce(
    (sum, l) => sum + l.todos.filter(t => t.status === 'pending').length, 0
  );
  const criticalExceptions = logs.reduce(
    (sum, l) => sum + l.exceptions.filter(e => e.severity === 'critical').length, 0
  );
  return { total, draft, pendingSignature, completed, totalEvents, unresolvedEvents, pendingTodos, criticalExceptions };
};

export const generateSignatureCanvasId = (role: 'outgoing' | 'incoming'): string => {
  return `sig-canvas-${role}`;
};
