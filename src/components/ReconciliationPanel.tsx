import { useState, useMemo } from 'react';
import {
  Receipt,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Scale,
  TrendingUp,
  PackageOpen,
  ArrowRight,
  RefreshCw,
  Ban,
} from 'lucide-react';
import type {
  ReconciliationData,
  CashDiscrepancyType,
  DiscrepancyStatus,
  PaymentMethodStats,
} from '../types';
import {
  getPaymentMethodColor,
  getPaymentMethodIcon,
  calculateCashDifference,
  createDiscrepancyRecord,
  reviewDiscrepancy,
  getDiscrepancyStatusInfo,
  getDiscrepancyTypeInfo,
  validateDiscrepancyAmount,
  validateDiscrepancyDescription,
  canCloseShift,
  closeShift,
  formatCurrency,
  formatPercentage,
} from '../utils/reconciliationUtils';
import { getCurrentTime } from '../utils/scheduleUtils';

interface ReconciliationPanelProps {
  data: ReconciliationData;
  onDataChange: (data: ReconciliationData) => void;
  isHistoryMode?: boolean;
}

type DiscrepancyFilter = 'all' | DiscrepancyStatus;

export default function ReconciliationPanel({
  data,
  onDataChange,
  isHistoryMode = false,
}: ReconciliationPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDiscId, setExpandedDiscId] = useState<string | null>(null);
  const [discrepancyFilter, setDiscrepancyFilter] = useState<DiscrepancyFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newDiscType, setNewDiscType] = useState<CashDiscrepancyType>('short');
  const [newDiscAmount, setNewDiscAmount] = useState('');
  const [newDiscDescription, setNewDiscDescription] = useState('');
  const [newDiscErrors, setNewDiscErrors] = useState<{ amount?: string; description?: string }>({});

  const [reviewComment, setReviewComment] = useState('');
  const [reviewingDiscId, setReviewingDiscId] = useState<string | null>(null);

  const cashDiff = useMemo(() => {
    if (data.actualCashAmount === undefined) return null;
    return calculateCashDifference(data.expectedCashAmount, data.actualCashAmount);
  }, [data.expectedCashAmount, data.actualCashAmount]);

  const filteredDiscrepancies = useMemo(() => {
    let result = [...data.discrepancies];
    if (discrepancyFilter !== 'all') {
      result = result.filter(d => d.status === discrepancyFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        d =>
          d.description.toLowerCase().includes(term) ||
          d.reportedBy.toLowerCase().includes(term) ||
          (d.reviewComment?.toLowerCase().includes(term) ?? false)
      );
    }
    return result.sort((a, b) => {
      const statusOrder = { pending: 0, rejected: 1, approved: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [data.discrepancies, discrepancyFilter, searchTerm]);

  const pendingCount = data.discrepancies.filter(d => d.status === 'pending').length;
  const approvedCount = data.discrepancies.filter(d => d.status === 'approved').length;
  const rejectedCount = data.discrepancies.filter(d => d.status === 'rejected').length;

  const closeShiftInfo = canCloseShift(data);

  const handleAddDiscrepancy = () => {
    const amount = parseFloat(newDiscAmount);
    const amountError = validateDiscrepancyAmount(amount);
    const descError = validateDiscrepancyDescription(newDiscDescription);

    if (amountError || descError) {
      setNewDiscErrors({ amount: amountError ?? undefined, description: descError ?? undefined });
      return;
    }

    const record = createDiscrepancyRecord(
      data.summary.id,
      newDiscType,
      amount,
      data.summary.operatorName,
      newDiscDescription.trim(),
      getCurrentTime()
    );

    onDataChange({
      ...data,
      discrepancies: [...data.discrepancies, record],
    });

    setShowAddModal(false);
    setNewDiscAmount('');
    setNewDiscDescription('');
    setNewDiscErrors({});
  };

  const handleReview = (discId: string, status: DiscrepancyStatus) => {
    if (!reviewComment.trim() && status === 'rejected') {
      return;
    }
    const record = data.discrepancies.find(d => d.id === discId);
    if (!record) return;

    const updated = reviewDiscrepancy(
      record,
      status,
      '王店长',
      reviewComment.trim() || (status === 'approved' ? '审核通过' : ''),
      getCurrentTime()
    );

    onDataChange({
      ...data,
      discrepancies: data.discrepancies.map(d => (d.id === discId ? updated : d)),
    });

    setReviewingDiscId(null);
    setReviewComment('');
  };

  const handleCloseShift = () => {
    if (!closeShiftInfo.canClose) return;
    try {
      const closed = closeShift(data);
      onDataChange(closed);
    } catch {
      // handled by canCloseShift check
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">夜间收银对账</h2>
              <p className="text-indigo-100 text-sm">
                {data.summary.shiftDate} · {data.summary.shiftName} ·{' '}
                {data.summary.startTime}-{data.summary.endTime}
              </p>
            </div>
          </div>
          {!isHistoryMode && (
            <div className="flex items-center gap-2">
              {data.summary.isClosed ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400/30 text-emerald-50 rounded-lg text-sm font-medium">
                  <FileCheck className="w-4 h-4" />
                  已结班
                </span>
              ) : (
                <button
                  onClick={handleCloseShift}
                  disabled={!closeShiftInfo.canClose}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    closeShiftInfo.canClose
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm'
                      : 'bg-white/20 text-white/50 cursor-not-allowed'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  {closeShiftInfo.canClose ? '确认结班' : closeShiftInfo.reason}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            班次营收汇总
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="订单总数"
              value={data.summary.totalOrders.toString()}
              suffix="单"
              icon={<PackageOpen className="w-5 h-5" />}
              gradient="from-blue-50 to-blue-100"
              iconColor="text-blue-600"
            />
            <SummaryCard
              label="营业总额"
              value={formatCurrency(data.summary.totalRevenue)}
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="from-emerald-50 to-emerald-100"
              iconColor="text-emerald-600"
              highlight
            />
            <SummaryCard
              label="退款金额"
              value={formatCurrency(data.summary.refundAmount)}
              icon={<Ban className="w-5 h-5" />}
              gradient="from-rose-50 to-rose-100"
              iconColor="text-rose-600"
            />
            <SummaryCard
              label="净营收"
              value={formatCurrency(data.summary.netRevenue)}
              icon={<Wallet className="w-5 h-5" />}
              gradient="from-amber-50 to-amber-100"
              iconColor="text-amber-600"
              highlight
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">当班收银员</p>
                  <p className="font-semibold text-gray-800">{data.summary.operatorName}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">班次时段</p>
                  <p className="font-semibold text-gray-800">
                    {data.summary.startTime} <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" />{' '}
                    {data.summary.endTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cashDiff?.type === 'short'
                      ? 'bg-rose-50'
                      : cashDiff?.type === 'over'
                      ? 'bg-emerald-50'
                      : cashDiff?.type === null
                      ? 'bg-gray-100'
                      : 'bg-slate-100'
                  }`}
                >
                  <Scale
                    className={`w-5 h-5 ${
                      cashDiff?.type === 'short'
                        ? 'text-rose-600'
                        : cashDiff?.type === 'over'
                        ? 'text-emerald-600'
                        : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-gray-500">现金核对</span>
                    {data.actualCashAmount !== undefined ? (
                      <span
                        className={`text-xs font-semibold ${
                          cashDiff?.type === 'short'
                            ? 'text-rose-600'
                            : cashDiff?.type === 'over'
                            ? 'text-emerald-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {cashDiff?.type === 'short'
                          ? `短款 ${formatCurrency(cashDiff.amount)}`
                          : cashDiff?.type === 'over'
                          ? `长款 ${formatCurrency(cashDiff.amount)}`
                          : '账实相符'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">待录入实钞</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 font-medium">
                      应: {formatCurrency(data.expectedCashAmount)}
                    </span>
                    <span className="text-gray-300">/</span>
                    <span
                      className={`font-semibold ${
                        data.actualCashAmount !== undefined ? 'text-gray-800' : 'text-slate-400'
                      }`}
                    >
                      实:{' '}
                      {data.actualCashAmount !== undefined
                        ? formatCurrency(data.actualCashAmount)
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-100" />

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            支付方式统计
          </h3>
          <div className="space-y-3">
            {data.paymentStats.map((stat, idx) => (
              <PaymentStatRow key={stat.method} stat={stat} rank={idx + 1} />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.paymentStats.map(stat => (
              <div
                key={stat.method}
                className={`rounded-xl p-3 border bg-gradient-to-br ${getPaymentMethodColor(
                  stat.method
                )}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{getPaymentMethodIcon(stat.method)}</span>
                  <span className="text-xs font-medium opacity-80">{stat.methodName}</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(stat.netAmount)}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {stat.orderCount}单 · {formatPercentage(stat.percentage)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gray-100" />

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              短款长款登记与审核
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-normal">
                  {pendingCount} 待审核
                </span>
              )}
            </h3>

            {!isHistoryMode && !data.summary.isClosed && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                登记差异
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(
              [
                { key: 'all', label: '全部', count: data.discrepancies.length },
                { key: 'pending', label: '待审核', count: pendingCount },
                { key: 'approved', label: '已通过', count: approvedCount },
                { key: 'rejected', label: '已驳回', count: rejectedCount },
              ] as const
            ).map(item => (
              <button
                key={item.key}
                onClick={() => setDiscrepancyFilter(item.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  discrepancyFilter === item.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
                <span
                  className={`ml-1.5 text-xs ${
                    discrepancyFilter === item.key ? 'text-indigo-100' : 'text-gray-400'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}

            <div className="flex-1 min-w-[200px] max-w-xs ml-auto relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索差异记录..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {filteredDiscrepancies.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">暂无差异记录</p>
              <p className="text-gray-400 text-sm mt-1">账目清晰，继续保持！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDiscrepancies.map(record => {
                const isExpanded = expandedDiscId === record.id;
                const isReviewing = reviewingDiscId === record.id;
                const statusInfo = getDiscrepancyStatusInfo(record.status);
                const typeInfo = getDiscrepancyTypeInfo(record.type);

                return (
                  <div
                    key={record.id}
                    className={`rounded-xl border transition-all ${
                      record.status === 'pending'
                        ? 'border-amber-200 bg-amber-50/40'
                        : record.status === 'approved'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-200 bg-rose-50/40'
                    }`}
                  >
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer"
                      onClick={() =>
                        !isReviewing && setExpandedDiscId(isExpanded ? null : record.id)
                      }
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          record.type === 'short'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {record.type === 'short' ? (
                          <AlertTriangle className="w-6 h-6" />
                        ) : (
                          <RefreshCw className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-bold ${typeInfo.color}`}
                          >
                            {typeInfo.prefix}
                            {formatCurrency(record.amount)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {typeInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-1">{record.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.reportedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {record.reportedTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {record.status === 'pending' && !isHistoryMode && !data.summary.isClosed && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setReviewingDiscId(isReviewing ? null : record.id);
                              setExpandedDiscId(record.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              isReviewing
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {isReviewing ? '取消' : '审核'}
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-200/60 pt-4 ml-4">
                        <div className="space-y-2 mb-4">
                          <div>
                            <span className="text-xs text-gray-500">差异说明：</span>
                            <p className="text-sm text-gray-800 mt-1 bg-white/70 rounded-lg p-3">
                              {record.description}
                            </p>
                          </div>
                          {record.reviewComment && (
                            <div>
                              <span className="text-xs text-gray-500">
                                审核意见（{record.reviewedBy} · {record.reviewedTime}）：
                              </span>
                              <p className="text-sm text-gray-800 mt-1 bg-white/70 rounded-lg p-3">
                                {record.reviewComment}
                              </p>
                            </div>
                          )}
                        </div>

                        {isReviewing && (
                          <div className="bg-white rounded-xl p-4 border border-indigo-200 space-y-3">
                            <p className="text-sm font-semibold text-gray-700">审核操作</p>
                            <textarea
                              value={reviewComment}
                              onChange={e => setReviewComment(e.target.value)}
                              placeholder="请输入审核意见（驳回时必填）..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReview(record.id, 'approved')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                通过
                              </button>
                              <button
                                onClick={() => handleReview(record.id, 'rejected')}
                                disabled={!reviewComment.trim()}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  reviewComment.trim()
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <XCircle className="w-4 h-4" />
                                驳回
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">登记收银差异</h3>
                  <p className="text-indigo-100 text-xs">请如实填写差异信息</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDiscErrors({});
                  setNewDiscAmount('');
                  setNewDiscDescription('');
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">差异类型</label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: 'short' as const, label: '短款', desc: '实际金额少于账面', color: 'rose' },
                      { value: 'over' as const, label: '长款', desc: '实际金额多于账面', color: 'emerald' },
                    ] as const
                  ).map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setNewDiscType(item.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        newDiscType === item.value
                          ? item.color === 'rose'
                            ? 'border-rose-400 bg-rose-50'
                            : 'border-emerald-400 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p
                        className={`font-semibold ${
                          newDiscType === item.value
                            ? item.color === 'rose'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  差异金额 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ¥
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="请输入金额"
                    value={newDiscAmount}
                    onChange={e => {
                      setNewDiscAmount(e.target.value);
                      if (newDiscErrors.amount) setNewDiscErrors(prev => ({ ...prev, amount: undefined }));
                    }}
                    className={`w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      newDiscErrors.amount
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400 bg-rose-50/50'
                        : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-400'
                    }`}
                  />
                </div>
                {newDiscErrors.amount && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {newDiscErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  差异原因说明 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="请详细描述差异产生的原因，如：某笔交易找零错误、顾客未付款离开等..."
                  value={newDiscDescription}
                  onChange={e => {
                    setNewDiscDescription(e.target.value);
                    if (newDiscErrors.description)
                      setNewDiscErrors(prev => ({ ...prev, description: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                    newDiscErrors.description
                      ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400 bg-rose-50/50'
                      : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-400'
                  }`}
                />
                {newDiscErrors.description && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {newDiscErrors.description}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDiscErrors({});
                    setNewDiscAmount('');
                    setNewDiscDescription('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddDiscrepancy}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  确认登记
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  icon,
  gradient,
  iconColor,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  gradient: string;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 bg-gradient-to-br ${gradient} ${
        highlight ? 'ring-2 ring-offset-1 ring-indigo-200' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`${iconColor}`}>{icon}</span>
        <span className="text-xs text-gray-500/70 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`text-xl font-bold ${highlight ? 'text-gray-900' : 'text-gray-800'}`}>
          {value}
        </p>
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

function PaymentStatRow({ stat, rank }: { stat: PaymentMethodStats; rank: number }) {
  const colors: Record<string, string> = {
    cash: 'bg-emerald-500',
    wechat: 'bg-green-500',
    alipay: 'bg-sky-500',
    card: 'bg-violet-500',
    other: 'bg-gray-400',
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${getPaymentMethodColor(
            stat.method
          )}`}
        >
          <span className="text-base">{getPaymentMethodIcon(stat.method)}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{stat.methodName}</span>
            {rank <= 3 && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                TOP{rank}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-gray-500">
              {stat.orderCount}单 · 退{stat.refundCount}单
            </span>
            <span className="font-bold text-gray-900">{formatCurrency(stat.netAmount)}</span>
          </div>
        </div>
        <div className="h-2 bg-gray-200/80 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors[stat.method]} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(stat.percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>占比 {formatPercentage(stat.percentage)}</span>
          {stat.refundAmount > 0 && <span>退款 {formatCurrency(stat.refundAmount)}</span>}
        </div>
      </div>
    </div>
  );
}
