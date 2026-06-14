import { useState, useEffect } from 'react';
import { Package, TrendingDown, AlertTriangle, X, Info, ClipboardList, ClipboardCheck, PackagePlus, ArrowRightCircle } from 'lucide-react';
import type { Product } from '../types';

interface StockCalculatorProps {
  products: Product[];
  selectedProduct: Product | null;
  onReplenish: (productId: string, amount: number) => void;
  onQuickRestock?: (productId: string) => void;
  onMarkOutOfStock?: (productId: string, registered: boolean) => void;
  onMoveToExpiring?: (productId: string) => void;
}

interface OverCapacityModalProps {
  product: Product;
  requestedAmount: number;
  maxAllowed: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function OverCapacityModal({ product, requestedAmount, maxAllowed, onConfirm, onCancel }: OverCapacityModalProps) {
  const totalStock = product.stock + requestedAmount;
  const overAmount = totalStock - product.maxStock;
  const batches = Math.ceil(requestedAmount / maxAllowed);
  
  const batchPlan = () => {
    const plan = [];
    let remaining = requestedAmount;
    for (let i = 0; i < batches; i++) {
      const batchAmount = Math.min(remaining, maxAllowed);
      plan.push(batchAmount);
      remaining -= batchAmount;
    }
    return plan;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-800">补货量超出货架容量</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 text-lg">{product.name}</h4>
            <p className="text-sm text-gray-500 mt-1">货架位置：{product.shelfLocation}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">容量超限警告</p>
                <p className="text-sm text-amber-700 mt-1">
                  当前库存 <span className="font-semibold">{product.stock}</span> 件 + 
                  补货 <span className="font-semibold">{requestedAmount}</span> 件 = 
                  总计 <span className="font-bold text-red-600">{totalStock}</span> 件
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  货架最大容量：<span className="font-semibold">{product.maxStock}</span> 件
                </p>
                <p className="text-sm text-red-600 font-medium mt-2">
                  超出容量：{overAmount} 件
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-3">💡 分批补货建议</p>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">
                建议分 <span className="font-bold text-blue-800">{batches}</span> 次补货：
              </p>
              <div className="flex flex-wrap gap-2">
                {batchPlan().map((amount, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm"
                  >
                    第{index + 1}批：<span className="font-semibold text-blue-700">{amount}</span> 件
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                每次补货后货架将被填满，剩余部分下次再补
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回修改
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              按最大容量补货
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockCalculator({ products, selectedProduct, onReplenish, onQuickRestock, onMarkOutOfStock, onMoveToExpiring }: StockCalculatorProps) {
  const [replenishAmount, setReplenishAmount] = useState(0);
  const [showOverCapacityModal, setShowOverCapacityModal] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      const suggestedAmount = selectedProduct.maxStock - selectedProduct.stock;
      setReplenishAmount(suggestedAmount);
    } else {
      setReplenishAmount(0);
    }
  }, [selectedProduct]);

  const lowStockProducts = products.filter(p => p.stock < p.maxStock * 0.3);
  const expiringProducts = products.filter(p => p.expirationDate && new Date(p.expirationDate) <= new Date());
  const outOfStockProducts = products.filter(p => !!p.outOfStockRegistered);

  const calculateReplenish = () => {
    if (selectedProduct) {
      return selectedProduct.maxStock - selectedProduct.stock;
    }
    return 0;
  };

  const isOverCapacity = () => {
    if (!selectedProduct) return false;
    return selectedProduct.stock + replenishAmount > selectedProduct.maxStock;
  };

  const handleReplenish = () => {
    if (selectedProduct && replenishAmount > 0) {
      if (isOverCapacity()) {
        setShowOverCapacityModal(true);
      } else {
        confirmReplenish();
      }
    }
  };

  const confirmReplenish = () => {
    if (selectedProduct && replenishAmount > 0) {
      const actualAmount = Math.min(replenishAmount, calculateReplenish());
      onReplenish(selectedProduct.id, actualAmount);
      setReplenishAmount(0);
      setShowOverCapacityModal(false);
    }
  };

  const handleCancelOverCapacity = () => {
    setShowOverCapacityModal(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-800">库存计算</h2>
      </div>

      {selectedProduct ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{selectedProduct.name}</h3>
              {selectedProduct.outOfStockRegistered && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" />
                  缺货登记
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-500">当前库存</p>
                <p className={`text-2xl font-bold ${selectedProduct.stock < selectedProduct.maxStock * 0.3 ? 'text-red-600' : 'text-gray-800'}`}>
                  {selectedProduct.stock}
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-500">最大库存</p>
                <p className="text-2xl font-bold text-gray-800">{selectedProduct.maxStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">快捷操作</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onQuickRestock && onQuickRestock(selectedProduct.id)}
                disabled={calculateReplenish() <= 0}
                className="flex flex-col items-center gap-1 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <PackagePlus className="w-4 h-4" />
                <span className="text-xs font-medium">一键补货</span>
              </button>
              <button
                onClick={() => onMarkOutOfStock && onMarkOutOfStock(selectedProduct.id, !selectedProduct.outOfStockRegistered)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg transition-colors ${
                  selectedProduct.outOfStockRegistered
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                }`}
              >
                {selectedProduct.outOfStockRegistered ? (
                  <ClipboardCheck className="w-4 h-4" />
                ) : (
                  <ClipboardList className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {selectedProduct.outOfStockRegistered ? '取消缺货' : '缺货登记'}
                </span>
              </button>
              <button
                onClick={() => onMoveToExpiring && onMoveToExpiring(selectedProduct.id)}
                disabled={selectedProduct.category === 'expiring'}
                className="flex flex-col items-center gap-1 p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <ArrowRightCircle className="w-4 h-4" />
                <span className="text-xs font-medium">移至临期</span>
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isOverCapacity() ? 'bg-amber-50' : 'bg-blue-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">建议补货数量</span>
              <span className="text-xl font-bold text-blue-600">{calculateReplenish()}</span>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-gray-600 mb-1">输入补货数量</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(Number(e.target.value) || 0)}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    isOverCapacity() 
                      ? 'border-amber-400 focus:ring-amber-500 bg-amber-50' 
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                  placeholder="输入数量"
                />
                <button
                  onClick={() => setReplenishAmount(calculateReplenish())}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  最大值
                </button>
              </div>
              {isOverCapacity() && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>补货量将超过货架容量</span>
                </div>
              )}
            </div>
            <button
              onClick={handleReplenish}
              disabled={replenishAmount <= 0}
              className={`w-full mt-4 py-3 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                isOverCapacity() 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isOverCapacity() ? '确认补货（超量）' : '确认补货'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">请从商品面板选择一个商品</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">库存紧张</p>
              <p className="text-lg font-bold text-red-600">{lowStockProducts.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">即将过期</p>
              <p className="text-lg font-bold text-orange-600">{expiringProducts.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">缺货登记</p>
              <p className="text-lg font-bold text-purple-600">{outOfStockProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {showOverCapacityModal && selectedProduct && (
        <OverCapacityModal
          product={selectedProduct}
          requestedAmount={replenishAmount}
          maxAllowed={calculateReplenish()}
          onConfirm={confirmReplenish}
          onCancel={handleCancelOverCapacity}
        />
      )}
    </div>
  );
}
