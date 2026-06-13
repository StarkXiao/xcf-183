import { Coffee, Cookie, Clock, Search, Filter, AlertTriangle, AlertCircle, Bell } from 'lucide-react';
import type { Product } from '../types';
import { getExpiryWarningLevel, getExpiryWarningConfig, getDaysUntilExpiry } from '../utils/expiryUtils';

interface ProductPanelProps {
  filteredProducts: Product[];
  onProductSelect: (product: Product) => void;
  selectedProductId?: string | null;
  selectedCategory: string;
  searchTerm: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (term: string) => void;
}

const categoryConfig = {
  beverage: { label: '饮料', icon: Coffee, color: 'bg-blue-100 text-blue-700' },
  rice_ball: { label: '饭团/便当', icon: Cookie, color: 'bg-orange-100 text-orange-700' },
  expiring: { label: '临期商品', icon: Clock, color: 'bg-red-100 text-red-700' },
};

const expiryLevelIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  attention: Bell,
};

export default function ProductPanel({
  filteredProducts,
  onProductSelect,
  selectedProductId,
  selectedCategory,
  searchTerm,
  onCategoryChange,
  onSearchChange,
}: ProductPanelProps) {

  const getStockStatus = (stock: number, maxStock: number) => {
    const percentage = (stock / maxStock) * 100;
    if (percentage < 30) return { color: 'bg-red-500', status: '库存紧张' };
    if (percentage < 60) return { color: 'bg-yellow-500', status: '库存偏低' };
    return { color: 'bg-green-500', status: '库存充足' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">商品面板</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="beverage">饮料</option>
            <option value="rice_ball">饭团/便当</option>
            <option value="expiring">临期商品</option>
          </select>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索商品..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {filteredProducts.map((product) => {
          const { color: statusColor, status } = getStockStatus(product.stock, product.maxStock);
          const CategoryIcon = categoryConfig[product.category].icon;
          const expiryLevel = getExpiryWarningLevel(product.expirationDate);
          const expiryConfig = expiryLevel ? getExpiryWarningConfig(expiryLevel) : null;
          const daysLeft = product.expirationDate ? getDaysUntilExpiry(product.expirationDate) : null;
          const ExpiryIcon = expiryLevel ? expiryLevelIcons[expiryLevel] : null;

          return (
            <div
              key={product.id}
              onClick={() => onProductSelect(product)}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedProductId === product.id
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 shadow-md'
                  : expiryConfig
                  ? `${expiryConfig.border} ${expiryConfig.bg} hover:border-blue-300`
                  : 'border-gray-100 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${categoryConfig[product.category].color}`}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">货架位置: {product.shelfLocation}</p>
                  </div>
                </div>
                {expiryConfig && ExpiryIcon && (
                  <span className={`px-2 py-1 ${expiryConfig.badgeBg} ${expiryConfig.badgeText} text-xs rounded-full flex items-center gap-1`}>
                    <ExpiryIcon className="w-3 h-3" />
                    {daysLeft !== null && daysLeft > 0 ? `${daysLeft}天后过期` : daysLeft === 0 ? '今日过期' : '已过期'}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">库存:</span>
                  <span className={`text-sm font-semibold ${product.stock < product.maxStock * 0.3 ? 'text-red-600' : 'text-gray-800'}`}>
                    {product.stock} / {product.maxStock}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColor} transition-all`}
                      style={{ width: `${(product.stock / product.maxStock) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{status}</span>
                </div>
              </div>
              {expiryConfig && (
                <div className={`mt-3 pt-3 border-t ${expiryConfig.border} border-dashed`}>
                  <p className={`text-xs ${expiryConfig.color}`}>
                    <span className="font-medium">{expiryConfig.label}：</span>
                    {expiryConfig.suggestion}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
