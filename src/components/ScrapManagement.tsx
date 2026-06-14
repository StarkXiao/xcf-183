import { useState, useMemo } from 'react';
import {
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Package,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Eye,
  User,
  X,
} from 'lucide-react';
import type { ScrapItem, ScrapReason, ScrapReviewStatus, Product, MonthlyLossStats } from '../types';
import {
  SCRAP_REASON_OPTIONS,
  getScrapReasonLabel,
  getScrapReasonColor,
  getReviewStatusLabel,
  getReviewStatusColor,
  getConfirmationStatusLabel,
  getConfirmationStatusColor,
  getCategoryLabel,
  calculateMonthlyLossStats,
  getAvailableMonths,
  getCurrentMonth,
  createScrapItem,
  reviewScrapItem,
  confirmScrapItem,
  formatLossAmount,
  getMonthLabel,
} from '../utils/scrapUtils';

interface ScrapManagementProps {
  items: ScrapItem[];
  products: Product[];
  onUpdateItems: (items: ScrapItem[]) => void;
}

type SubTab = 'register' | 'review' | 'confirm' | 'report';

function RegisterModal({
  products,
  onClose,
  onSubmit,
}: {
  products: Product[];
  onClose: () => void;
  onSubmit: (item: ScrapItem) => void;
}) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reason, setReason] = useState<ScrapReason>('near_expiry');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = () => {
    if (!selectedProduct || quantity <= 0) return;
    const item = createScrapItem(
      selectedProduct.id,
      selectedProduct.name,
      selectedProduct.category,
      reason,
      quantity,
      selectedProduct.price,
      selectedProduct.shelfLocation,
      '张夜班',
      selectedProduct.expirationDate,
      notes.trim() || undefined,
    );
    onSubmit(item);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800">临期下架登记</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择商品</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">请选择商品</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (库存: {p.stock}, {p.expirationDate ? `保质期至: ${p.expirationDate}` : '无保质期'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">报废原因</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as ScrapReason)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {SCRAP_REASON_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">报废数量</label>
            <input
              type="number"
              min={1}
              max={selectedProduct?.stock ?? 999}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">当前库存: {selectedProduct.stock}，单价: {formatLossAmount(selectedProduct.price)}</p>
            )}
          </div>
          {selectedProduct && (
            <div className="bg-red-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-red-700">预估损耗金额</span>
              <span className="text-lg font-bold text-red-600">{formatLossAmount(quantity * selectedProduct.price)}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="请输入备注信息..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedProduct || quantity <= 0}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交登记
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: ScrapItem;
  onClose: () => void;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment: string) => void;
}) {
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(item.id, comment.trim() || undefined);
    } else if (action === 'reject' && comment.trim()) {
      onReject(item.id, comment.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">主管审核</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">商品名称</span>
              <span className="font-medium text-gray-800">{item.productName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">报废原因</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScrapReasonColor(item.reason)}`}>{getScrapReasonLabel(item.reason)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">数量/金额</span>
              <span className="font-medium text-gray-800">{item.quantity}件 / {formatLossAmount(item.totalLoss)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">登记人/时间</span>
              <span className="text-gray-700">{item.registeredBy} {item.registeredTime}</span>
            </div>
            {item.notes && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">备注</span>
                <span className="text-gray-700">{item.notes}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">审核意见</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="请输入审核意见..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAction('approve')}
              className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                action === 'approve'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-green-50'
              }`}
            >
              ✓ 通过
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                action === 'reject'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'border-gray-200 text-gray-600 hover:bg-red-50'
              }`}
            >
              ✗ 驳回
            </button>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!action || (action === 'reject' && !comment.trim())}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认提交
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  item,
  onClose,
}: {
  item: ScrapItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Eye className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-800">报废详情</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">商品名称</span>
              <span className="font-medium text-gray-800">{item.productName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">商品分类</span>
              <span className="text-gray-700">{getCategoryLabel(item.category)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">报废原因</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScrapReasonColor(item.reason)}`}>{getScrapReasonLabel(item.reason)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">货架位置</span>
              <span className="text-gray-700">{item.shelfLocation}</span>
            </div>
            {item.expirationDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">保质期至</span>
                <span className="text-gray-700">{item.expirationDate}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">报废数量</span>
              <span className="text-gray-700">{item.quantity} 件</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">单价</span>
              <span className="text-gray-700">{formatLossAmount(item.unitPrice)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-500">损耗金额</span>
              <span className="text-red-600">{formatLossAmount(item.totalLoss)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs text-blue-600">1</span>
              </div>
              临期下架登记
            </div>
            <div className="ml-2.5 pl-4 border-l-2 border-gray-200 text-sm space-y-1 pb-2">
              <div className="flex justify-between">
                <span className="text-gray-500">登记人</span>
                <span className="text-gray-700">{item.registeredBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">登记时间</span>
                <span className="text-gray-700">{item.registeredTime}</span>
              </div>
              {item.notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">备注</span>
                  <span className="text-gray-700">{item.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                item.reviewStatus !== 'pending' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <span className={`text-xs ${item.reviewStatus !== 'pending' ? 'text-green-600' : 'text-yellow-600'}`}>2</span>
              </div>
              主管审核
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getReviewStatusColor(item.reviewStatus)}`}>
                {getReviewStatusLabel(item.reviewStatus)}
              </span>
            </div>
            <div className="ml-2.5 pl-4 border-l-2 border-gray-200 text-sm space-y-1 pb-2">
              {item.reviewedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">审核人</span>
                  <span className="text-gray-700">{item.reviewedBy}</span>
                </div>
              )}
              {item.reviewedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-500">审核时间</span>
                  <span className="text-gray-700">{item.reviewedTime}</span>
                </div>
              )}
              {item.reviewComment && (
                <div className="flex justify-between">
                  <span className="text-gray-500">审核意见</span>
                  <span className="text-gray-700">{item.reviewComment}</span>
                </div>
              )}
              {item.reviewStatus === 'pending' && (
                <p className="text-yellow-600 text-xs">等待主管审核...</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                item.confirmationStatus === 'confirmed' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <span className={`text-xs ${item.confirmationStatus === 'confirmed' ? 'text-green-600' : 'text-gray-400'}`}>3</span>
              </div>
              报废确认
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getConfirmationStatusColor(item.confirmationStatus)}`}>
                {getConfirmationStatusLabel(item.confirmationStatus)}
              </span>
            </div>
            <div className="ml-2.5 pl-4 border-l-2 border-gray-200 text-sm space-y-1">
              {item.confirmedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">确认人</span>
                  <span className="text-gray-700">{item.confirmedBy}</span>
                </div>
              )}
              {item.confirmedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-500">确认时间</span>
                  <span className="text-gray-700">{item.confirmedTime}</span>
                </div>
              )}
              {item.reviewStatus === 'approved' && item.confirmationStatus === 'unconfirmed' && (
                <p className="text-gray-400 text-xs">已通过审核，待确认报废</p>
              )}
              {item.reviewStatus === 'rejected' && (
                <p className="text-red-500 text-xs">审核已驳回，无需确认</p>
              )}
              {item.reviewStatus === 'pending' && (
                <p className="text-gray-400 text-xs">需先通过主管审核</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthlyReport({ stats }: { stats: MonthlyLossStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">报废总数</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalItems}</p>
          <p className="text-xs text-gray-500 mt-1">已确认 {stats.confirmedCount} 项</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">总损耗金额</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatLossAmount(stats.totalLoss)}</p>
          <p className="text-xs text-gray-500 mt-1">已确认 {formatLossAmount(stats.items.filter(i => i.confirmationStatus === 'confirmed').reduce((s, i) => s + i.totalLoss, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500">待审核</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">已驳回</span>
          </div>
          <p className="text-2xl font-bold text-gray-600">{stats.rejectedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">按报废原因统计</h4>
          <div className="space-y-3">
            {stats.byReason.map(item => {
              const maxLoss = Math.max(...stats.byReason.map(r => r.totalLoss), 1);
              const percentage = (item.totalLoss / maxLoss) * 100;
              return (
                <div key={item.reason}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.count}件 / {formatLossAmount(item.totalLoss)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.byReason.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">按商品分类统计</h4>
          <div className="space-y-3">
            {stats.byCategory.map(item => {
              const maxLoss = Math.max(...stats.byCategory.map(c => c.totalLoss), 1);
              const percentage = (item.totalLoss / maxLoss) * 100;
              return (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.count}件 / {formatLossAmount(item.totalLoss)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.byCategory.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-semibold text-gray-800">报废明细</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">商品</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">原因</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">数量</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">损耗</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">审核</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">确认</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">登记人</th>
              </tr>
            </thead>
            <tbody>
              {stats.items.map(item => (
                <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      <p className="text-xs text-gray-400">{item.shelfLocation}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScrapReasonColor(item.reason)}`}>
                      {getScrapReasonLabel(item.reason)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-red-600">{formatLossAmount(item.totalLoss)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getReviewStatusColor(item.reviewStatus)}`}>
                      {getReviewStatusLabel(item.reviewStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getConfirmationStatusColor(item.confirmationStatus)}`}>
                      {getConfirmationStatusLabel(item.confirmationStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{item.registeredBy}</td>
                </tr>
              ))}
              {stats.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无报废记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ScrapManagement({ items, products, onUpdateItems }: ScrapManagementProps) {
  const [subTab, setSubTab] = useState<SubTab>('register');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<ScrapItem | null>(null);
  const [detailItem, setDetailItem] = useState<ScrapItem | null>(null);
  const [filterReason, setFilterReason] = useState<ScrapReason | 'all'>('all');
  const [filterReview, setFilterReview] = useState<ScrapReviewStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const availableMonths = useMemo(() => getAvailableMonths(items), [items]);
  const monthlyStats = useMemo(() => calculateMonthlyLossStats(items, selectedMonth), [items, selectedMonth]);

  const pendingItems = useMemo(() => {
    return items
      .filter(i => i.reviewStatus === 'pending')
      .filter(i => filterReason === 'all' || i.reason === filterReason)
      .filter(i => !searchTerm || i.productName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, filterReason, searchTerm]);

  const approvedUnconfirmed = useMemo(() => {
    return items
      .filter(i => i.reviewStatus === 'approved' && i.confirmationStatus === 'unconfirmed')
      .filter(i => filterReason === 'all' || i.reason === filterReason)
      .filter(i => !searchTerm || i.productName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, filterReason, searchTerm]);

  const allFiltered = useMemo(() => {
    return items
      .filter(i => filterReason === 'all' || i.reason === filterReason)
      .filter(i => filterReview === 'all' || i.reviewStatus === filterReview)
      .filter(i => !searchTerm || i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.registeredTime.localeCompare(a.registeredTime));
  }, [items, filterReason, filterReview, searchTerm]);

  const handleRegister = (item: ScrapItem) => {
    onUpdateItems([...items, item]);
    setShowRegisterModal(false);
  };

  const handleApprove = (id: string, comment?: string) => {
    onUpdateItems(items.map(i => i.id === id ? reviewScrapItem(i, 'approved', '李店长', comment) : i));
    setReviewingItem(null);
  };

  const handleReject = (id: string, comment: string) => {
    onUpdateItems(items.map(i => i.id === id ? reviewScrapItem(i, 'rejected', '李店长', comment) : i));
    setReviewingItem(null);
  };

  const handleConfirm = (id: string) => {
    onUpdateItems(items.map(i => i.id === id ? confirmScrapItem(i, '张夜班') : i));
  };

  const statCards = [
    {
      icon: Clock,
      label: '待审核',
      value: pendingItems.length,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      icon: CheckCircle,
      label: '待确认',
      value: approvedUnconfirmed.length,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Trash2,
      label: '本月报废',
      value: monthlyStats.confirmedCount,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: DollarSign,
      label: '本月损耗',
      value: formatLossAmount(monthlyStats.totalLoss),
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  const subTabs: { key: SubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'register', label: '临期下架登记', icon: ClipboardCheck },
    { key: 'review', label: '主管审核', icon: ShieldCheck },
    { key: 'confirm', label: '报废确认', icon: CheckCircle },
    { key: 'report', label: '月度损耗报表', icon: BarChart3 },
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
          <div className="flex">
            {subTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSubTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors ${
                  subTab === tab.key
                    ? 'border-red-500 text-red-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === 'review' && pendingItems.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">{pendingItems.length}</span>
                )}
                {tab.key === 'confirm' && approvedUnconfirmed.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{approvedUnconfirmed.length}</span>
                )}
              </button>
            ))}
          </div>
          {subTab === 'register' && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              <Plus className="w-4 h-4" />
              新增登记
            </button>
          )}
        </div>

        <div className="p-4">
          {subTab === 'register' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索商品名称..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <select
                  value={filterReason}
                  onChange={e => setFilterReason(e.target.value as ScrapReason | 'all')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">全部原因</option>
                  {SCRAP_REASON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={filterReview}
                  onChange={e => setFilterReview(e.target.value as ScrapReviewStatus | 'all')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>

              <div className="space-y-2">
                {allFiltered.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800 truncate">{item.productName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getScrapReasonColor(item.reason)}`}>
                          {getScrapReasonLabel(item.reason)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{item.shelfLocation}</span>
                        <span>{item.quantity}件</span>
                        <span className="text-red-500 font-medium">{formatLossAmount(item.totalLoss)}</span>
                        <span>{item.registeredBy} {item.registeredTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getReviewStatusColor(item.reviewStatus)}`}>
                        {getReviewStatusLabel(item.reviewStatus)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getConfirmationStatusColor(item.confirmationStatus)}`}>
                        {getConfirmationStatusLabel(item.confirmationStatus)}
                      </span>
                      <button
                        onClick={() => setDetailItem(item)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {allFiltered.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无报废登记记录</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {subTab === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索商品名称..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterReason}
                  onChange={e => setFilterReason(e.target.value as ScrapReason | 'all')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部原因</option>
                  {SCRAP_REASON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {pendingItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无待审核的报废登记</p>
                  <p className="text-xs mt-1">所有报废登记已审核完毕</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingItems.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{item.productName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getScrapReasonColor(item.reason)}`}>
                              {getScrapReasonLabel(item.reason)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{item.shelfLocation}</span>
                            <span>{item.quantity}件</span>
                            <span className="text-red-500 font-medium">损耗: {formatLossAmount(item.totalLoss)}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-200">
                          待审核
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          <User className="w-3 h-3 inline mr-1" />
                          {item.registeredBy} 登记于 {item.registeredTime}
                          {item.notes && ` · ${item.notes}`}
                        </span>
                        <button
                          onClick={() => setReviewingItem(item)}
                          className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        >
                          审核处理
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {subTab === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索商品名称..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={filterReason}
                  onChange={e => setFilterReason(e.target.value as ScrapReason | 'all')}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">全部原因</option>
                  {SCRAP_REASON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {approvedUnconfirmed.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无需确认的报废项目</p>
                  <p className="text-xs mt-1">已通过审核的项目将在此显示</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedUnconfirmed.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-blue-200 bg-blue-50/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">{item.productName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getScrapReasonColor(item.reason)}`}>
                              {getScrapReasonLabel(item.reason)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{item.shelfLocation}</span>
                            <span>{item.quantity}件</span>
                            <span className="text-red-500 font-medium">损耗: {formatLossAmount(item.totalLoss)}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                          审核通过
                        </span>
                      </div>
                      {item.reviewComment && (
                        <p className="text-xs text-gray-500 mb-2">
                          审核意见: {item.reviewComment} ({item.reviewedBy} {item.reviewedTime})
                        </p>
                      )}
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => handleConfirm(item.id)}
                          className="px-3 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600"
                        >
                          确认报废
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {subTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{getMonthLabel(month)}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  共 {monthlyStats.totalItems} 条报废记录，总损耗 <span className="font-medium text-red-600">{formatLossAmount(monthlyStats.totalLoss)}</span>
                </span>
              </div>
              <MonthlyReport stats={monthlyStats} />
            </div>
          )}
        </div>
      </div>

      {showRegisterModal && (
        <RegisterModal
          products={products}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegister}
        />
      )}

      {reviewingItem && (
        <ReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
