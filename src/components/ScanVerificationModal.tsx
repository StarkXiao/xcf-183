import { useState, useMemo } from 'react';
import {
  X,
  QrCode,
  Check,
  AlertTriangle,
  Camera,
  Package,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { DeliveryAppointment, DeliveryItem } from '../types';
import {
  DELIVERY_STATUS_CONFIG,
  DISCREPANCY_TYPE_CONFIG,
  hasAllItemsChecked,
  calculateDiscrepancies,
} from '../utils/deliveryUtils';

export interface ScanVerificationModalProps {
  delivery: DeliveryAppointment;
  onVerifyComplete: (deliveryId: string, items: DeliveryAppointment['items']) => void;
  onReportDiscrepancy: (productId: string, updatedItem: DeliveryItem) => void;
  onClose: () => void;
}

export default function ScanVerificationModal({
  delivery,
  onVerifyComplete,
  onReportDiscrepancy,
  onClose,
}: ScanVerificationModalProps) {
  const [items, setItems] = useState<DeliveryItem[]>(
    delivery.items.map(item => ({
      ...item,
      actualQuantity: item.actualQuantity ?? item.expectedQuantity,
      checked: item.checked ?? false,
    }))
  );
  const [showScanner, setShowScanner] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const isViewOnly = delivery.status === 'completed' || delivery.status === 'discrepancy';

  const discrepancies = useMemo(() => calculateDiscrepancies(items), [items]);
  const allChecked = useMemo(() => hasAllItemsChecked({ ...delivery, items }), [delivery, items]);
  const hasDiscrepancies = discrepancies.length > 0;

  const handleQuantityChange = (productId: string, value: number) => {
    if (isViewOnly) return;
    
    const actualValue = Math.max(0, value);
    setItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, actualQuantity: actualValue, checked: true }
        : item
    ));
  };

  const handleCheckItem = (productId: string, checked: boolean) => {
    if (isViewOnly) return;
    
    setItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, checked }
        : item
    ));
  };

  const handleMarkAllChecked = () => {
    if (isViewOnly) return;
    setItems(prev => prev.map(item => ({ ...item, checked: true })));
  };

  const handleScan = () => {
    if (!scanInput.trim()) {
      setScanError('请输入或扫描二维码');
      return;
    }

    if (scanInput.trim() === delivery.qrCode || scanInput.trim() === delivery.deliveryNo) {
      setShowScanner(false);
      setScanError('');
      setScanInput('');
      
      if (delivery.status === 'registered') {
        setItems(prev => prev.map(item => ({ ...item, checked: true })));
      }
    } else {
      setScanError('二维码不匹配，请确认送货单号');
    }
  };

  const handleSimulateScan = () => {
    if (delivery.qrCode) {
      setScanInput(delivery.qrCode);
    }
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!allChecked) {
      newErrors.push('请先核验所有商品');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onVerifyComplete(delivery.id, items);
  };

  const totalExpected = items.reduce((sum, item) => sum + item.expectedQuantity, 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actualQuantity || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-500" />
              {isViewOnly ? '送货详情' : '扫码核验签收'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isViewOnly ? '查看送货核验详情' : `送货单号：${delivery.deliveryNo}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isViewOnly && !showScanner && delivery.status !== 'verifying' && delivery.status !== 'completed' && delivery.status !== 'discrepancy' && (
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <QrCode className="w-8 h-8 text-orange-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">请扫描送货单二维码</h4>
                <p className="text-sm text-gray-500 mb-4">扫描送货单上的二维码开始核验</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowScanner(true)}
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    打开扫码
                  </button>
                  <button
                    onClick={handleSimulateScan}
                    className="px-6 py-2.5 bg-white text-orange-600 border border-orange-200 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                  >
                    模拟扫码
                  </button>
                </div>
              </div>
            </div>
          )}

          {showScanner && (
            <div className="mb-6 p-6 bg-gray-900 rounded-xl">
              <div className="text-center">
                <div className="relative w-64 h-64 mx-auto mb-4">
                  <div className="absolute inset-0 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-500" />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse" />
                </div>
                <p className="text-gray-400 text-sm mb-4">将二维码放入框内自动识别</p>
                <div className="flex items-center gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    placeholder="或手动输入送货单号/二维码"
                    value={scanInput}
                    onChange={(e) => {
                      setScanInput(e.target.value);
                      setScanError('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleScan}
                    className="px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    确定
                  </button>
                </div>
                {scanError && (
                  <div className="mt-3 text-red-400 text-sm flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {scanError}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setScanError('');
                    setScanInput('');
                  }}
                  className="mt-4 text-gray-400 text-sm hover:text-white transition-colors"
                >
                  取消扫码
                </button>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                <AlertCircle className="w-5 h-5" />
                请修正以下错误
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-800">供应商信息</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">供应商</span>
                  <span className="text-gray-800 font-medium">{delivery.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">联系人</span>
                  <span className="text-gray-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    {delivery.contactPerson}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">联系电话</span>
                  <span className="text-gray-800 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {delivery.contactPhone}
                  </span>
                </div>
                {delivery.licensePlate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">车牌号</span>
                    <span className="text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {delivery.licensePlate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-800">送货信息</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">状态</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DELIVERY_STATUS_CONFIG[delivery.status].color}`}>
                    {DELIVERY_STATUS_CONFIG[delivery.status].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">预约时间</span>
                  <span className="text-gray-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {delivery.scheduledDate} {delivery.scheduledTime}
                  </span>
                </div>
                {delivery.actualArrivalTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">到达时间</span>
                    <span className="text-gray-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-500" />
                      {delivery.actualArrivalTime}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">登记人</span>
                  <span className="text-gray-800">{delivery.registeredBy}</span>
                </div>
              </div>
            </div>
          </div>

          {delivery.discrepancies.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-3">
                <AlertTriangle className="w-5 h-5" />
                差异记录 ({delivery.discrepancies.length} 条)
              </div>
              <div className="space-y-3">
                {delivery.discrepancies.map(disc => (
                  <div key={disc.id} className="p-3 bg-white rounded-lg border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DISCREPANCY_TYPE_CONFIG[disc.type].color}`}>
                          {DISCREPANCY_TYPE_CONFIG[disc.type].label}
                        </span>
                        <span className="font-medium text-gray-800">{disc.productName}</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        disc.status === 'pending' ? 'text-orange-500' : 
                        disc.status === 'resolved' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {disc.status === 'pending' ? '待处理' : disc.status === 'resolved' ? '已解决' : '已驳回'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      预期：{disc.expectedQuantity}，实收：{disc.actualQuantity}，差异：{disc.difference > 0 ? '+' : ''}{disc.difference}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">{disc.description}</div>
                    {disc.photos.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {disc.photos.map((_photo, idx) => (
                          <div key={idx} className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            📷 {idx + 1}
                          </div>
                        ))}
                      </div>
                    )}
                    {disc.resolution && (
                      <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                        <span className="font-medium text-green-700">处理结果：</span>{disc.resolution}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      上报人：{disc.reportedBy} · {disc.reportedTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                商品核验清单
              </h4>
              {!isViewOnly && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    已核验 <span className="font-semibold text-gray-800">{items.filter(i => i.checked).length}</span> / {items.length}
                  </div>
                  <button
                    onClick={handleMarkAllChecked}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    全部核验
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{totalExpected}</div>
                  <div className="text-xs text-gray-500">预期总数</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${totalActual !== totalExpected ? 'text-red-600' : 'text-green-600'}`}>
                    {totalActual}
                  </div>
                  <div className="text-xs text-gray-500">实收总数</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${totalActual - totalExpected !== 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {totalActual - totalExpected > 0 ? '+' : ''}{totalActual - totalExpected}
                  </div>
                  <div className="text-xs text-gray-500">差异数</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium w-10"></th>
                    <th className="pb-3 font-medium">商品名称</th>
                    <th className="pb-3 font-medium text-center">预期</th>
                    <th className="pb-3 font-medium text-center">实收</th>
                    <th className="pb-3 font-medium text-center">差异</th>
                    <th className="pb-3 font-medium text-right">金额</th>
                    {!isViewOnly && <th className="pb-3 font-medium text-center w-24">操作</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, index) => {
                    const hasDiff = item.actualQuantity !== undefined && item.actualQuantity !== item.expectedQuantity;
                    
                    return (
                      <tr key={index} className={item.checked ? 'bg-green-50/50' : ''}>
                        <td className="py-3">
                          {item.checked ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-200 rounded-full" />
                          )}
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-gray-800">{item.productName}</div>
                          <div className="text-xs text-gray-400">单价 ¥{item.price.toFixed(2)}/{item.unit}</div>
                        </td>
                        <td className="py-3 text-center text-gray-600 font-medium">
                          {item.expectedQuantity} {item.unit}
                        </td>
                        <td className="py-3 text-center">
                          {isViewOnly ? (
                            <span className={hasDiff ? 'text-red-600 font-medium' : 'text-gray-800 font-medium'}>
                              {item.actualQuantity ?? item.expectedQuantity} {item.unit}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={item.actualQuantity ?? item.expectedQuantity}
                              onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                              onBlur={() => handleCheckItem(item.productId, true)}
                              className={`w-20 px-2 py-1.5 text-sm text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                hasDiff ? 'border-red-300 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {hasDiff ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              (item.actualQuantity || 0) < item.expectedQuantity 
                                ? 'text-red-600 bg-red-100' 
                                : 'text-orange-600 bg-orange-100'
                            }`}>
                              {(item.actualQuantity || 0) - item.expectedQuantity > 0 ? '+' : ''}
                              {(item.actualQuantity || 0) - item.expectedQuantity}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-gray-800">
                          ¥{((item.actualQuantity ?? item.expectedQuantity) * item.price).toFixed(2)}
                        </td>
                        {!isViewOnly && (
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleCheckItem(item.productId, !item.checked)}
                                className={`p-1.5 rounded transition-colors ${
                                  item.checked 
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={item.checked ? '取消核验' : '标记已核验'}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              {hasDiff && (
                                <button
                                  onClick={() => onReportDiscrepancy(item.productId, item)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="上报差异"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {hasDiscrepancies && !isViewOnly && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                <AlertTriangle className="w-5 h-5" />
                发现 {discrepancies.length} 个商品存在数量差异
              </div>
              <p className="text-sm text-orange-600 mb-3">
                请点击差异商品旁的 🔺 按钮上报差异详情并拍照留证
              </p>
              <div className="flex flex-wrap gap-2">
                {discrepancies.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 rounded-full text-xs text-orange-700"
                  >
                    {item.productName}
                    <span className="font-medium">
                      ({(item.actualQuantity || 0) - item.expectedQuantity > 0 ? '+' : ''}
                      {(item.actualQuantity || 0) - item.expectedQuantity})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {delivery.remarks && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">备注</div>
              <div className="text-gray-800">{delivery.remarks}</div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">合计金额</div>
              <div className="text-2xl font-bold text-gray-800">
                ¥{items.reduce((sum, item) => sum + ((item.actualQuantity ?? item.expectedQuantity) * item.price), 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            {isViewOnly ? '关闭' : '取消'}
          </button>
          {!isViewOnly && (
            <button
              onClick={handleSubmit}
              disabled={!allChecked}
              className={`px-8 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                allChecked
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              确认签收
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
