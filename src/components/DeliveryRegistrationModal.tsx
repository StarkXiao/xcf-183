import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Phone,
  Truck,
  Package,
  MapPin,
  Thermometer,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import type { DeliveryAppointment, Supplier, Product, DeliveryItem } from '../types';
import {
  getDeliverySlotAvailability,
  validateDeliveryItems,
  calculateTotalAmount,
} from '../utils/deliveryUtils';
import { formatDate } from '../utils/historyUtils';

export interface DeliveryRegistrationModalProps {
  suppliers: Supplier[];
  products: Product[];
  deliveries: DeliveryAppointment[];
  onSubmit: (delivery: Omit<DeliveryAppointment, 'id' | 'deliveryNo' | 'qrCode' | 'registeredTime' | 'discrepancies'>) => void;
  onClose: () => void;
}

export default function DeliveryRegistrationModal({
  suppliers,
  products,
  deliveries,
  onSubmit,
  onClose,
}: DeliveryRegistrationModalProps) {
  const today = formatDate(new Date());
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [scheduledDate, setScheduledDate] = useState(today);
  const [scheduledTime, setScheduledTime] = useState('22:00');
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [temperature, setTemperature] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  const slotAvailability = getDeliverySlotAvailability(scheduledDate, deliveries, 3);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setContactPerson(supplier.contactPerson);
    setContactPhone(supplier.phone);
    setShowSupplierDropdown(false);
    setSupplierSearch(supplier.name);
  };

  const handleAddItem = () => {
    const newItem: DeliveryItem = {
      productId: '',
      productName: '',
      expectedQuantity: 1,
      unit: '个',
      price: 0,
      actualQuantity: 0,
      checked: false,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, product: Product) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: product.id,
      productName: product.name,
      price: product.price,
    };
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof DeliveryItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddProductItem = (product: Product) => {
    const existingIndex = items.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        expectedQuantity: updated[existingIndex].expectedQuantity + 1,
      };
      setItems(updated);
    } else {
      const newItem: DeliveryItem = {
        productId: product.id,
        productName: product.name,
        expectedQuantity: 1,
        unit: '个',
        price: product.price,
        actualQuantity: 0,
        checked: false,
      };
      setItems([...items, newItem]);
    }
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!selectedSupplier) {
      newErrors.push('请选择供应商');
    }
    if (!scheduledDate) {
      newErrors.push('请选择预约日期');
    }
    if (!scheduledTime) {
      newErrors.push('请选择预约时间');
    }
    if (!contactPerson.trim()) {
      newErrors.push('请输入联系人');
    }
    if (!contactPhone.trim()) {
      newErrors.push('请输入联系电话');
    }

    const itemValidation = validateDeliveryItems(items);
    if (!itemValidation.valid) {
      newErrors.push(...itemValidation.errors);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const totalAmount = calculateTotalAmount(items);

    onSubmit({
      supplierId: selectedSupplier!.id,
      supplierName: selectedSupplier!.name,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      scheduledDate,
      scheduledTime,
      estimatedArrivalTime: estimatedArrivalTime.trim() || undefined,
      actualArrivalTime: undefined,
      status: 'registered',
      items: items.map(item => ({ ...item, actualQuantity: item.expectedQuantity })),
      totalAmount,
      remarks: remarks.trim() || undefined,
      registeredBy: '张夜班',
      verifiedBy: undefined,
      verifiedTime: undefined,
      licensePlate: licensePlate.trim() || undefined,
      driverName: driverName.trim() || undefined,
      temperature: temperature.trim() || undefined,
    });
  };

  const totalAmount = calculateTotalAmount(items);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" />
              来货预登记
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">登记供应商送货预约信息</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                供应商信息
              </h4>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  供应商 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索或选择供应商..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {showSupplierDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">没有找到供应商</div>
                    ) : (
                      filteredSuppliers.map(supplier => (
                        <button
                          key={supplier.id}
                          onClick={() => handleSupplierSelect(supplier)}
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                        >
                          <div className="font-medium text-gray-800">{supplier.name}</div>
                          <div className="text-xs text-gray-500">{supplier.contactPerson} · {supplier.phone} · {supplier.category}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    联系人 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="请输入联系人"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="请输入联系电话"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    司机姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="请输入司机姓名"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    车牌号
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="请输入车牌号"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  温控要求
                </label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="如：2-6℃ 或 常温"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                预约信息
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    预约日期 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    预约时间 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      {slotAvailability.map(slot => {
                        const [startTime] = slot.timeSlot.split('-');
                        return (
                          <option
                            key={slot.timeSlot}
                            value={startTime}
                            disabled={!slot.available}
                          >
                            {slot.timeSlot} {slot.available ? `(${slot.currentBookings}/${slot.maxDeliveries})` : '(已满)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  预计到达时间
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={estimatedArrivalTime}
                    onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  备注
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="请输入备注信息，如：夜间送货请走后门、冷链运输注意保温等..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                送货商品清单
                <span className="text-sm font-normal text-gray-500">
                  ({items.length} 种商品)
                </span>
              </h4>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加商品
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-2">快速添加商品（点击添加）</div>
              <div className="flex flex-wrap gap-2">
                {products.slice(0, 10).map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProductItem(product)}
                    className="px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">商品名称</th>
                    <th className="pb-3 font-medium text-center">数量</th>
                    <th className="pb-3 font-medium text-center">单位</th>
                    <th className="pb-3 font-medium text-center">单价</th>
                    <th className="pb-3 font-medium text-right">小计</th>
                    <th className="pb-3 font-medium text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const product = products.find(p => p.id === e.target.value);
                            if (product) {
                              handleProductSelect(index, product);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">请选择商品</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.expectedQuantity}
                          onChange={(e) => handleItemChange(index, 'expectedQuantity', parseInt(e.target.value) || 1)}
                          className="w-24 px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="py-3">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-20 px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="个">个</option>
                          <option value="瓶">瓶</option>
                          <option value="盒">盒</option>
                          <option value="罐">罐</option>
                          <option value="包">包</option>
                          <option value="箱">箱</option>
                          <option value="袋">袋</option>
                          <option value="串">串</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-800">
                        ¥{(item.expectedQuantity * item.price).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>暂无商品，请点击上方"添加商品"按钮</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {items.length > 0 && (
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">合计金额</div>
                  <div className="text-2xl font-bold text-gray-800">
                    ¥{totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
          >
            提交预约
          </button>
        </div>
      </div>
    </div>
  );
}
