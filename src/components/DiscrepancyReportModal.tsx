import { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Image,
  AlertCircle,
  Package,
} from 'lucide-react';
import type { DeliveryAppointment, DeliveryDiscrepancy, DeliveryItem } from '../types';
import { DISCREPANCY_TYPES } from '../data/mockData';
import { createDiscrepancy } from '../utils/deliveryUtils';

export interface DiscrepancyReportModalProps {
  delivery: DeliveryAppointment;
  productId: string;
  updatedItem?: DeliveryItem;
  onSubmit: (discrepancy: DeliveryDiscrepancy) => void;
  onClose: () => void;
}

export default function DiscrepancyReportModal({
  delivery,
  productId,
  updatedItem,
  onSubmit,
  onClose,
}: DiscrepancyReportModalProps) {
  const originalItem = delivery.items.find(i => i.productId === productId);
  const item = updatedItem || originalItem;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [discrepancyType, setDiscrepancyType] = useState<'short' | 'over' | 'damaged' | 'expired' | 'wrong_item'>('short');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) {
    return null;
  }

  const expectedQty = item.expectedQuantity;
  const actualQty = item.actualQuantity ?? item.expectedQuantity;
  const difference = actualQty - expectedQty;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotos(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSimulatePhoto = () => {
    const simulatedPhotos = [
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('商品包装破损照片，仓库收货场景，自然光')}&image_size=square`,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('商品数量核对，清点货物照片，仓库场景')}&image_size=square`,
    ];
    const randomPhoto = simulatedPhotos[Math.floor(Math.random() * simulatedPhotos.length)];
    setPhotos(prev => [...prev, randomPhoto]);
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!discrepancyType) {
      newErrors.push('请选择差异类型');
    }
    if (!description.trim()) {
      newErrors.push('请输入差异说明');
    }
    if (photos.length === 0) {
      newErrors.push('请至少上传一张照片作为凭证');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const discrepancy = createDiscrepancy(
        delivery.id,
        item,
        discrepancyType,
        description.trim(),
        photos,
        '张夜班'
      );

      onSubmit(discrepancy);
      setIsSubmitting(false);
    }, 800);
  };

  const typeConfig = DISCREPANCY_TYPES.find(t => t.value === discrepancyType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              差异上报
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">记录送货差异并拍照留证</p>
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

          <div className="p-4 bg-gray-50 rounded-xl mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800">商品信息</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">商品名称</span>
                <span className="text-gray-800 font-medium">{item.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">预期数量</span>
                <span className="text-gray-800">{expectedQty} {item.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">实收数量</span>
                <span className={actualQty !== expectedQty ? 'text-red-600 font-medium' : 'text-gray-800'}>
                  {actualQty} {item.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">差异数量</span>
                <span className={`font-bold ${difference > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {difference > 0 ? '+' : ''}{difference} {item.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              差异类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {DISCREPANCY_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setDiscrepancyType(type.value as 'short' | 'over' | 'damaged' | 'expired' | 'wrong_item')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                    discrepancyType === type.value
                      ? `${type.color} border-current`
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              差异说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`请详细描述${typeConfig?.label || '差异'}情况，包括发现过程、具体数量、可能原因等...`}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              照片凭证 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">（至少1张，最多6张）</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
                >
                  <img
                    src={photo}
                    alt={`差异照片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                    {index + 1}
                  </div>
                </div>
              ))}

              {photos.length < 6 && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">拍照</span>
                  </button>
                  <button
                    onClick={handleSimulatePhoto}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-500"
                  >
                    <Image className="w-6 h-6" />
                    <span className="text-xs">模拟拍照</span>
                  </button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                从相册选择
              </button>
              <span>支持 JPG、PNG 格式，单张不超过 10MB</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-700 mb-1">上报须知</div>
                <ul className="text-amber-600 space-y-1">
                  <li className="flex items-start gap-1.5">
                    <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    请确保照片清晰可辨，能够完整展示差异情况
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    差异说明需包含具体数量、包装情况、生产日期等关键信息
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    上报后将自动通知供应商和店长处理
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                提交上报
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
