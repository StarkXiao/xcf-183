import { useState, useMemo } from 'react';
import {
  Receipt,
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  DollarSign,
  ShoppingCart,
  FileCheck,
  Eye,
  Ban,
  CheckCheck,
  X,
} from 'lucide-react';
import type {
  ShiftRevenue,
  ShiftRevenueSummary,
  CashDiscrepancy,
  DiscrepancyType,
  DiscrepancyStatus,
} from '../types';
import {
  buildShiftSummary,
  formatCurrency,
  getPaymentMethodColor,
  getDiscrepancyTypeLabel,
  getDiscrepancyStatusLabel,
  createDiscrepancy,
  updateDiscrepancyStatus,
  getTimeOfDayPaymentStats,
} from '../utils/reconciliationUtils';
import { getCurrentTime } from '../utils/scheduleUtils';

interface NightReconciliationProps {
  shifts: ShiftRevenue[];
  onUpdateShift?: (updatedShift: ShiftRevenue) => void;
}

interface RegisterDiscrepancyModalProps {
  shiftId: string;
  expectedCash: number;
  actualCash: number;
  onClose: () => void;
  onSubmit: (type: DiscrepancyType, amount: number, reason: string) => void;
}

function RegisterDiscrepancyModal({
  expectedCash,
  actualCash,
  onClose,
  onSubmit,
}: RegisterDiscrepancyModalProps) {
  const difference = Math.round((actualCash - expectedCash) * 100) / 100;
  const defaultType: DiscrepancyType = difference < 0 ? 'short' : 'over';
  const [type, setType] = useState<DiscrepancyType>(defaultType);
  const [amount, setAmount] = useState<number>(Math.abs(difference));
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (amount <= 0 || !reason.trim()) return;
    onSubmit(type, amount, reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              type === 'short' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {type === 'short' ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
              )}
            </div>
            <h3 className="font-semibold text-gray-800">
              登记{getDiscrepancyTypeLabel(type)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-1">应有现金</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(expectedCash)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-1">实点现金</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(actualCash)}
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-lg text-center border ${
            difference < 0
              ? 'bg-red-50 border-red-200'
              : difference > 0
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-xs text-gray-600 mb-1">差额</p>
            <p className={`text-xl font-bold ${
              difference < 0
                ? 'text-red-600'
                : difference > 0
                ? 'text-green-600'
                : 'text-gray-600'
            }`}>
              {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              差异类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType('short')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'short'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${
                  type === 'short' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  type === 'short' ? 'text-red-700' : 'text-gray-600'
                }`}>
                  短款（实少应多）
                </p>
              </button>
              <button
                onClick={() => setType('over')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'over'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${
                  type === 'over' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  type === 'over' ? 'text-green-700' : 'text-gray-600'
                }`}>
                  长款（实多应少）
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金额（元）
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="请输入金额"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原因说明
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="请详细说明差异原因，如：找零错误、重复收款等"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={amount <= 0 || !reason.trim()}
              className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              提交登记
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReviewDiscrepancyModalProps {
  discrepancy: CashDiscrepancy;
  onClose: () => void;
  onReview: (status: DiscrepancyStatus, comment: string) => void;
}

function ReviewDiscrepancyModal({
  discrepancy,
  onClose,
  onReview,
}: ReviewDiscrepancyModalProps) {
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800">审核差异登记</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className={`p-4 rounded-lg ${
            discrepancy.type === 'short' ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">差异类型</span>
              <span className={`text-sm font-semibold ${
                discrepancy.type === 'short' ? 'text-red-700' : 'text-green-700'
              }`}>
                {getDiscrepancyTypeLabel(discrepancy.type)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">差异金额</span>
              <span className={`text-lg font-bold ${
                discrepancy.type === 'short' ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(discrepancy.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">登记时间</span>
              <span className="text-sm text-gray-700">{discrepancy.registeredTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">登记人</span>
              <span className="text-sm text-gray-700">{discrepancy.registeredBy}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">登记原因</p>
            <p className="text-sm text-gray-600">{discrepancy.reason}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              审核意见
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="请填写审核意见"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onReview('rejected', comment.trim())}
              className="flex-1 py-2.5 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              驳回
            </button>
            <button
              onClick={() => onReview('approved', comment.trim() || '审核通过')}
              className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              通过
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NightReconciliation({ shifts, onUpdateShift }: NightReconciliationProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.shiftId || '');
  const [expandedPaymentStats, setExpandedPaymentStats] = useState(true);
  const [expandedDiscrepancies, setExpandedDiscrepancies] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [reviewingDiscrepancy, setReviewingDiscrepancy] = useState<CashDiscrepancy | null>(null);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [editingCash, setEditingCash] = useState(false);

  const selectedShift = useMemo(
    () => shifts.find(s => s.shiftId === selectedShiftId),
    [shifts, selectedShiftId]
  );

  const summary: ShiftRevenueSummary | null = useMemo(() => {
    if (!selectedShift) return null;
    return buildShiftSummary(selectedShift);
  }, [selectedShift]);

  const timeSlotStats = useMemo(() => {
    if (!selectedShift) return [];
    return getTimeOfDayPaymentStats(selectedShift.payments);
  }, [selectedShift]);

  const handleCashConfirm = () => {
    if (!selectedShift || !summary) return;
    const newActual = Number(actualCashInput);
    if (isNaN(newActual) || newActual < 0) return;

    const difference = Math.round((newActual - summary.expectedCash) * 100) / 100;
    if (Math.abs(difference) > 0.01) {
      setShowRegisterModal(true);
    }
    setEditingCash(false);
  };

  const handleRegisterDiscrepancy = (type: DiscrepancyType, amount: number, reason: string) => {
    if (!selectedShift) return;
    const now = getCurrentTime();
    const newDiscrepancy = createDiscrepancy(
      selectedShift.shiftId,
      type,
      amount,
      reason,
      selectedShift.operator,
      now
    );

    const updatedShift: ShiftRevenue = {
      ...selectedShift,
      actualCash: Number(actualCashInput) || selectedShift.actualCash,
      discrepancies: [...selectedShift.discrepancies, newDiscrepancy],
    };
    onUpdateShift?.(updatedShift);
    setShowRegisterModal(false);
    setActualCashInput('');
  };

  const handleReviewDiscrepancy = (status: DiscrepancyStatus, comment: string) => {
    if (!selectedShift || !reviewingDiscrepancy) return;
    const now = getCurrentTime();
    const updated = updateDiscrepancyStatus(
      reviewingDiscrepancy,
      status,
      '李店长',
      now,
      comment
    );

    const updatedShift: ShiftRevenue = {
      ...selectedShift,
      discrepancies: selectedShift.discrepancies.map(d =>
        d.id === updated.id ? updated : d
      ),
    };
    onUpdateShift?.(updatedShift);
    setReviewingDiscrepancy(null);
  };

  const pendingCount = shifts.reduce(
    (sum, s) => sum + s.discrepancies.filter(d => d.status === 'pending').length,
    0
  );

  if (!summary || !selectedShift) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无班次数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">夜间收银对账</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              <Clock className="w-3 h-3" />
              {pendingCount} 项待审核
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择班次
        </label>
        <div className="flex flex-wrap gap-2">
          {shifts.map(shift => {
            const isSelected = shift.shiftId === selectedShiftId;
            const hasPending = shift.discrepancies.some(d => d.status === 'pending');
            return (
              <button
                key={shift.shiftId}
                onClick={() => setSelectedShiftId(shift.shiftId)}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{shift.shiftDate}</span>
                <span className="text-sm text-gray-400">{shift.shiftName}</span>
                {hasPending && (
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">收银员</p>
              <p className="text-sm font-semibold text-gray-800">{summary.operator}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">订单数</p>
              <p className="text-sm font-semibold text-gray-800">{summary.totalOrders} 单</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">总营收</p>
              <p className="text-sm font-bold text-green-700">{formatCurrency(summary.totalRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              summary.isBalanced ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {summary.isBalanced ? (
                <FileCheck className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">对账状态</p>
              <p className={`text-sm font-semibold ${
                summary.isBalanced ? 'text-green-700' : 'text-amber-700'
              }`}>
                {summary.isBalanced ? '账实相符' : '存在差异'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              应有现金
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(summary.expectedCash)}
          </p>
          <p className="text-xs text-gray-500 mt-1">系统计算应收现金</p>
        </div>

        <div className={`p-4 rounded-xl border ${
          editingCash ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              实点现金
            </span>
            {!editingCash && (
              <button
                onClick={() => {
                  setActualCashInput(String(summary.actualCash));
                  setEditingCash(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                修改
              </button>
            )}
          </div>
          {editingCash ? (
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-bold"
                autoFocus
              />
              <button
                onClick={handleCashConfirm}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
              >
                确认
              </button>
              <button
                onClick={() => {
                  setEditingCash(false);
                  setActualCashInput('');
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(summary.actualCash)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">收银员实际清点金额</p>
        </div>

        <div className={`p-4 rounded-xl border ${
          Math.abs(summary.cashDifference) < 0.01
            ? 'bg-green-50 border-green-100'
            : summary.cashDifference < 0
            ? 'bg-red-50 border-red-100'
            : 'bg-green-50 border-green-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 flex items-center gap-1.5">
              {Math.abs(summary.cashDifference) < 0.01 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : summary.cashDifference < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
              现金差额
            </span>
          </div>
          <p className={`text-2xl font-bold ${
            Math.abs(summary.cashDifference) < 0.01
              ? 'text-green-700'
              : summary.cashDifference < 0
              ? 'text-red-700'
              : 'text-green-700'
          }`}>
            {summary.cashDifference > 0 ? '+' : ''}{formatCurrency(summary.cashDifference)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.abs(summary.cashDifference) < 0.01
              ? '账实相符'
              : summary.cashDifference < 0
              ? '短款，实点少于应有'
              : '长款，实点多于应有'}
          </p>
        </div>
      </div>

      <div
        className="mb-6 border border-gray-200 rounded-xl overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setExpandedPaymentStats(!expandedPaymentStats)}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-800">支付方式统计</h3>
            <span className="text-sm text-gray-500">
              共 {selectedShift.payments.length} 笔交易
            </span>
          </div>
          {expandedPaymentStats ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {expandedPaymentStats && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {summary.paymentStats.map(stat => (
                <div
                  key={stat.method}
                  className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${getPaymentMethodColor(stat.method)} flex items-center justify-center`}>
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(stat.amount)}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>{stat.count} 笔</span>
                    <span className="font-medium text-indigo-600">{stat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
                {summary.paymentStats.map(stat => (
                  <div
                    key={stat.method}
                    className={`h-full transition-all ${getPaymentMethodColor(stat.method)}`}
                    style={{ width: `${stat.percentage}%` }}
                    title={`${stat.label}: ${stat.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {summary.paymentStats.map(stat => (
                  <div key={stat.method} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className={`w-3 h-3 rounded ${getPaymentMethodColor(stat.method)}`}></span>
                    {stat.label} ({stat.percentage}%)
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">分时段营收</p>
              <div className="space-y-2">
                {timeSlotStats.map(slot => (
                  <div key={slot.slot} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24">{slot.slot}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                        style={{
                          width: `${summary.totalRevenue > 0 ? (slot.amount / summary.totalRevenue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-20 text-right">
                      {formatCurrency(slot.amount)}
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {slot.count} 笔
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setExpandedDiscrepancies(!expandedDiscrepancies)}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-800">短款长款记录</h3>
            {summary.pendingDiscrepancies > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                {summary.pendingDiscrepancies} 项待审核
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActualCashInput(String(summary.actualCash));
                setShowRegisterModal(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              登记差异
            </button>
            {expandedDiscrepancies ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>

        {expandedDiscrepancies && (
          <div className="p-4">
            {summary.discrepancies.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">本班次无短款长款记录，账实相符</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.discrepancies.map(disc => (
                  <div
                    key={disc.id}
                    className={`p-4 rounded-lg border ${
                      disc.status === 'pending'
                        ? 'bg-amber-50 border-amber-200'
                        : disc.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          disc.type === 'short' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {disc.type === 'short' ? (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${
                              disc.type === 'short' ? 'text-red-700' : 'text-green-700'
                            }`}>
                              {getDiscrepancyTypeLabel(disc.type)}
                            </span>
                            <span className={`text-lg font-bold ${
                              disc.type === 'short' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(disc.amount)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                              disc.status === 'pending'
                                ? 'bg-amber-200 text-amber-800'
                                : disc.status === 'approved'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {disc.status === 'pending' && <Clock className="w-3 h-3" />}
                              {disc.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                              {disc.status === 'rejected' && <XCircle className="w-3 h-3" />}
                              {getDiscrepancyStatusLabel(disc.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{disc.reason}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>登记人: {disc.registeredBy}</span>
                            <span>登记时间: {disc.registeredTime}</span>
                            {disc.reviewedBy && (
                              <span>审核人: {disc.reviewedBy}</span>
                            )}
                            {disc.reviewedTime && (
                              <span>审核时间: {disc.reviewedTime}</span>
                            )}
                          </div>
                          {disc.reviewComment && (
                            <div className="mt-2 p-2 bg-white/60 rounded">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">审核意见: </span>
                                {disc.reviewComment}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {disc.status === 'pending' && (
                        <button
                          onClick={() => setReviewingDiscrepancy(disc)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          审核
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showRegisterModal && (
        <RegisterDiscrepancyModal
          shiftId={selectedShift.shiftId}
          expectedCash={summary.expectedCash}
          actualCash={Number(actualCashInput) || summary.actualCash}
          onClose={() => {
            setShowRegisterModal(false);
            setActualCashInput('');
          }}
          onSubmit={handleRegisterDiscrepancy}
        />
      )}

      {reviewingDiscrepancy && (
        <ReviewDiscrepancyModal
          discrepancy={reviewingDiscrepancy}
          onClose={() => setReviewingDiscrepancy(null)}
          onReview={handleReviewDiscrepancy}
        />
      )}
    </div>
  );
}
