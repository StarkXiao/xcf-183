import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Truck,
  Plus,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  ChevronRight,
  Calendar,
  Phone,
  User,
  MapPin,
  Thermometer,
  Search,
  Filter,
  BarChart3,
} from 'lucide-react';
import type { DeliveryAppointment, Supplier, Product, DeliveryItem } from '../types';
import {
  DELIVERY_STATUS_CONFIG,
  DISCREPANCY_TYPE_CONFIG,
  getTodayDeliveries,
  getUpcomingDeliveries,
  calculateDeliveryStats,
  formatDeliveryDate,
} from '../utils/deliveryUtils';
import { formatDate } from '../utils/historyUtils';
import { getCurrentTime } from '../utils/scheduleUtils';

import type { DeliveryRegistrationModalProps } from './DeliveryRegistrationModal';
import type { ScanVerificationModalProps } from './ScanVerificationModal';
import type { DiscrepancyReportModalProps } from './DiscrepancyReportModal';

interface SupplierDeliveryBoardProps {
  deliveries: DeliveryAppointment[];
  suppliers: Supplier[];
  products: Product[];
  onRegisterDelivery: (delivery: Omit<DeliveryAppointment, 'id' | 'deliveryNo' | 'qrCode' | 'registeredTime' | 'discrepancies'>) => void;
  onVerifyDelivery: (deliveryId: string, items: DeliveryAppointment['items']) => void;
  onReportDiscrepancy: (deliveryId: string, discrepancy: DeliveryAppointment['discrepancies'][0]) => void;
  onUpdateStatus: (deliveryId: string, status: DeliveryAppointment['status']) => void;
  onUpdateStock: (productId: string, amount: number) => void;
  DeliveryRegistrationModal: React.ComponentType<DeliveryRegistrationModalProps>;
  ScanVerificationModal: React.ComponentType<ScanVerificationModalProps>;
  DiscrepancyReportModal: React.ComponentType<DiscrepancyReportModalProps>;
}

export default function SupplierDeliveryBoard({
  deliveries,
  suppliers,
  products,
  onRegisterDelivery,
  onVerifyDelivery,
  onReportDiscrepancy,
  onUpdateStatus,
  onUpdateStock,
  DeliveryRegistrationModal,
  ScanVerificationModal,
  DiscrepancyReportModal,
}: SupplierDeliveryBoardProps) {
  const today = formatDate(new Date());
  const currentTime = getCurrentTime();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryAppointment | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'today' | 'upcoming' | 'all'>('today');
  const [discrepancyItem, setDiscrepancyItem] = useState<{ delivery: DeliveryAppointment; productId: string; updatedItem?: DeliveryItem } | null>(null);

  const selectedDeliveryIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedDeliveryIdRef.current = selectedDelivery?.id ?? null;
  }, [selectedDelivery]);

  useEffect(() => {
    const id = selectedDeliveryIdRef.current;
    if (id) {
      const updated = deliveries.find(d => d.id === id);
      if (updated) {
        setSelectedDelivery(updated);
      }
    }
  }, [deliveries]);

  const stats = useMemo(() => calculateDeliveryStats(deliveries, today), [deliveries, today]);

  const filteredDeliveries = useMemo(() => {
    let result: DeliveryAppointment[];

    if (selectedView === 'today') {
      result = getTodayDeliveries(deliveries, today);
    } else if (selectedView === 'upcoming') {
      result = getUpcomingDeliveries(deliveries, currentTime, 10);
    } else {
      result = [...deliveries].sort((a, b) => {
        if (a.scheduledDate !== b.scheduledDate) {
          return b.scheduledDate.localeCompare(a.scheduledDate);
        }
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.deliveryNo.toLowerCase().includes(term) ||
        d.supplierName.toLowerCase().includes(term) ||
        d.contactPerson.toLowerCase().includes(term) ||
        d.items.some(item => item.productName.toLowerCase().includes(term))
      );
    }

    return result;
  }, [deliveries, selectedView, statusFilter, searchTerm, today, currentTime]);

  const handleRegisterDelivery = (deliveryData: Omit<DeliveryAppointment, 'id' | 'deliveryNo' | 'qrCode' | 'registeredTime' | 'discrepancies'>) => {
    onRegisterDelivery(deliveryData);
    setShowRegistrationModal(false);
  };

  const handleStartVerification = (delivery: DeliveryAppointment) => {
    setSelectedDelivery(delivery);
    setShowVerificationModal(true);
  };

  const handleVerifyComplete = (deliveryId: string, items: DeliveryAppointment['items']) => {
    const currentDelivery = selectedDelivery?.id === deliveryId ? selectedDelivery : deliveries.find(d => d.id === deliveryId);
    
    onVerifyDelivery(deliveryId, items);
    
    items.forEach(item => {
      if (!item.actualQuantity || item.actualQuantity <= 0) return;

      let stockableQuantity = item.actualQuantity;

      if (currentDelivery) {
        const itemDiscrepancies = currentDelivery.discrepancies.filter(
          d => d.productId === item.productId
        );

        itemDiscrepancies.forEach(discrepancy => {
          if (discrepancy.type === 'damaged' || discrepancy.type === 'expired' || discrepancy.type === 'wrong_item') {
            const unusableQty = discrepancy.damagedQuantity ?? Math.max(0, Math.abs(discrepancy.difference));
            stockableQuantity -= unusableQty;
          }
        });
      }

      const finalQuantity = Math.max(0, stockableQuantity);
      if (finalQuantity > 0) {
        onUpdateStock(item.productId, finalQuantity);
      }
    });
    
    setShowVerificationModal(false);
    setSelectedDelivery(null);
  };

  const handleReportDiscrepancy = (delivery: DeliveryAppointment, productId: string, updatedItem?: DeliveryItem) => {
    setDiscrepancyItem({ delivery, productId, updatedItem });
    setShowDiscrepancyModal(true);
  };

  const handleDiscrepancySubmit = (discrepancy: DeliveryAppointment['discrepancies'][0]) => {
    if (discrepancyItem) {
      onReportDiscrepancy(discrepancyItem.delivery.id, discrepancy);
    }
    setShowDiscrepancyModal(false);
    setDiscrepancyItem(null);
  };

  const handleMarkArrived = (deliveryId: string) => {
    onUpdateStatus(deliveryId, 'arrived');
  };

  const handleStartVerifying = (deliveryId: string) => {
    onUpdateStatus(deliveryId, 'verifying');
  };

  const StatusBadge = ({ status }: { status: DeliveryAppointment['status'] }) => {
    const config = DELIVERY_STATUS_CONFIG[status];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const DeliveryCard = ({ delivery }: { delivery: DeliveryAppointment }) => {
    const hasDiscrepancies = delivery.discrepancies.length > 0;
    const pendingDiscrepancies = delivery.discrepancies.filter(d => d.status === 'pending').length;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">{delivery.deliveryNo}</span>
                <StatusBadge status={delivery.status} />
              </div>
              <p className="text-base font-medium text-gray-900">{delivery.supplierName}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {formatDeliveryDate(delivery.scheduledDate, delivery.scheduledTime)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>{delivery.contactPerson}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{delivery.contactPhone}</span>
            </div>
            {delivery.licensePlate && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{delivery.licensePlate}</span>
              </div>
            )}
            {delivery.temperature && (
              <div className="flex items-center gap-2 text-gray-600">
                <Thermometer className="w-4 h-4 text-gray-400" />
                <span>{delivery.temperature}</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {delivery.items.length} 种商品，共 {delivery.items.reduce((s, i) => s + i.expectedQuantity, 0)} 件
              </span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              {delivery.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.productName}</span>
                  <span className="text-gray-600">
                    {item.actualQuantity !== undefined && item.actualQuantity !== item.expectedQuantity ? (
                      <span className="text-red-500 line-through mr-2">{item.expectedQuantity}</span>
                    ) : null}
                    {item.actualQuantity ?? item.expectedQuantity} {item.unit}
                  </span>
                </div>
              ))}
              {delivery.items.length > 3 && (
                <div className="text-gray-400">...还有 {delivery.items.length - 3} 种商品</div>
              )}
            </div>
          </div>

          {hasDiscrepancies && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                存在差异 {pendingDiscrepancies > 0 && `(${pendingDiscrepancies} 待处理)`}
              </div>
              <div className="space-y-1">
                {delivery.discrepancies.map(disc => (
                  <div key={disc.id} className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${DISCREPANCY_TYPE_CONFIG[disc.type].color}`}>
                      {DISCREPANCY_TYPE_CONFIG[disc.type].label}
                    </span>
                    <span className="text-gray-600">{disc.productName}</span>
                    <span className={disc.status === 'pending' ? 'text-orange-500' : 'text-green-500'}>
                      {disc.status === 'pending' ? '待处理' : '已解决'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {delivery.remarks && (
            <div className="mb-4 text-sm text-gray-500">
              <span className="text-gray-400">备注：</span>{delivery.remarks}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">金额：</span>
              <span className="font-semibold text-gray-800">¥{delivery.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              {delivery.status === 'registered' && (
                <>
                  <button
                    onClick={() => handleMarkArrived(delivery.id)}
                    className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    确认到达
                  </button>
                  <button
                    onClick={() => handleStartVerification(delivery)}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <QrCode className="w-4 h-4" />
                    核验
                  </button>
                </>
              )}
              {delivery.status === 'arrived' && (
                <button
                  onClick={() => handleStartVerifying(delivery.id)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1"
                >
                  <QrCode className="w-4 h-4" />
                  开始核验
                </button>
              )}
              {delivery.status === 'verifying' && (
                <button
                  onClick={() => handleStartVerification(delivery)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1"
                >
                  <QrCode className="w-4 h-4" />
                  继续核验
                </button>
              )}
              {(delivery.status === 'completed' || delivery.status === 'discrepancy') && (
                <button
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setShowVerificationModal(true);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  查看详情
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            供应商送货预约看板
          </h2>
          <p className="text-sm text-gray-500 mt-1">管理供应商送货预约、扫码核验、差异上报</p>
        </div>
        <button
          onClick={() => setShowRegistrationModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          来货预登记
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-xs text-gray-500">今日送货</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.registered}</div>
              <div className="text-xs text-gray-500">已预约</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.arrived}</div>
              <div className="text-xs text-gray-500">已到达</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.completed}</div>
              <div className="text-xs text-gray-500">已完成</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.pendingDiscrepancies}</div>
              <div className="text-xs text-gray-500">待处理差异</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">¥{stats.totalAmount.toFixed(0)}</div>
              <div className="text-xs text-gray-500">今日总金额</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setSelectedView('today')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                selectedView === 'today'
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              今日送货
            </button>
            <button
              onClick={() => setSelectedView('upcoming')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                selectedView === 'upcoming'
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              即将到来
            </button>
            <button
              onClick={() => setSelectedView('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                selectedView === 'all'
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              全部记录
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="registered">已预约</option>
              <option value="arrived">已到达</option>
              <option value="verifying">核验中</option>
              <option value="completed">已完成</option>
              <option value="discrepancy">有差异</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索送货单号、供应商、商品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDeliveries.length === 0 ? (
          <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-xl p-12 text-center border border-gray-100">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">暂无送货记录</p>
            <p className="text-gray-400 text-sm mt-1">点击右上角"来货预登记"添加新的送货预约</p>
          </div>
        ) : (
          filteredDeliveries.map(delivery => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))
        )}
      </div>

      {showRegistrationModal && (
        <DeliveryRegistrationModal
          suppliers={suppliers}
          products={products}
          deliveries={deliveries}
          onSubmit={handleRegisterDelivery}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}

      {showVerificationModal && selectedDelivery && (
        <ScanVerificationModal
          delivery={selectedDelivery}
          onVerifyComplete={handleVerifyComplete}
          onReportDiscrepancy={(productId, updatedItem) => handleReportDiscrepancy(selectedDelivery, productId, updatedItem)}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedDelivery(null);
          }}
        />
      )}

      {showDiscrepancyModal && discrepancyItem && (
        <DiscrepancyReportModal
          delivery={discrepancyItem.delivery}
          productId={discrepancyItem.productId}
          updatedItem={discrepancyItem.updatedItem}
          onSubmit={handleDiscrepancySubmit}
          onClose={() => {
            setShowDiscrepancyModal(false);
            setDiscrepancyItem(null);
          }}
        />
      )}
    </div>
  );
}
