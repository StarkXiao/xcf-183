import { useState, useEffect } from 'react';
import { Package, TrendingDown, AlertTriangle } from 'lucide-react';
import type { Product } from '../types';

interface StockCalculatorProps {
  products: Product[];
  selectedProduct: Product | null;
  onReplenish: (productId: string, amount: number) => void;
}

export default function StockCalculator({ products, selectedProduct, onReplenish }: StockCalculatorProps) {
  const [replenishAmount, setReplenishAmount] = useState(0);

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

  const calculateReplenish = () => {
    if (selectedProduct) {
      return selectedProduct.maxStock - selectedProduct.stock;
    }
    return 0;
  };

  const handleReplenish = () => {
    if (selectedProduct && replenishAmount > 0) {
      onReplenish(selectedProduct.id, replenishAmount);
      setReplenishAmount(0);
    }
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
            <h3 className="font-semibold text-gray-800">{selectedProduct.name}</h3>
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

          <div className="p-4 bg-blue-50 rounded-lg">
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
                  max={calculateReplenish()}
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(Math.min(Number(e.target.value), calculateReplenish()))}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入数量"
                />
                <button
                  onClick={() => setReplenishAmount(calculateReplenish())}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  最大值
                </button>
              </div>
            </div>
            <button
              onClick={handleReplenish}
              disabled={replenishAmount <= 0}
              className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              确认补货
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
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>
    </div>
  );
}
