import { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ChevronRight,
  Package,
  MoveRight,
  LayoutGrid,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Info,
} from 'lucide-react';
import type { ShelfHeatmapData, ShelfStats, ShelfCell } from '../types';
import { getHeatColor, getHeatBgColor, getHeatLabel, getZoneName } from '../utils/shelfHeatmapUtils';

interface ShelfHeatmapProps {
  data: ShelfHeatmapData;
  days?: number;
}

export default function ShelfHeatmap({ data, days = 7 }: ShelfHeatmapProps) {
  const [selectedShelf, setSelectedShelf] = useState<ShelfStats | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const sortedStats = useMemo(() => {
    return [...data.stats].sort((a, b) => b.replenishCount - a.replenishCount);
  }, [data.stats]);

  const top5Shelves = sortedStats.slice(0, 5);
  const bottom5Shelves = sortedStats.slice(-5).reverse();

  const handleShelfClick = (cell: ShelfCell) => {
    if (cell.stats) {
      setSelectedShelf(cell.stats);
    }
  };

  const priorityConfig = {
    high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: '高优先级' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: '中优先级' },
    low: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', label: '低优先级' },
  };

  const suggestionTypeIcons: Record<string, typeof Lightbulb> = {
    move_high_turnover: TrendingUp,
    move_low_turnover: TrendingDown,
    rearrange_zone: LayoutGrid,
    optimize_path: Zap,
    expand_capacity: Package,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">货架陈列热力图</h2>
              <p className="text-sm text-gray-500">最近 {days} 天补货数据分析</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{data.totalReplenishments}</p>
                <p className="text-xs text-gray-500">总补货次数</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{data.avgReplenishTime}分钟</p>
                <p className="text-xs text-gray-500">平均补货耗时</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-orange-700">{data.mostActiveShelf}</p>
                <p className="text-xs text-gray-500">最活跃货架</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-700">{data.leastActiveShelf}</p>
                <p className="text-xs text-gray-500">最不活跃货架</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4 text-xs">
          <span className="text-gray-500 font-medium">活跃度图例：</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded ${getHeatBgColor('critical')}`}></span>
            <span className="text-gray-600">{getHeatLabel('critical')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded ${getHeatBgColor('high')}`}></span>
            <span className="text-gray-600">{getHeatLabel('high')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded ${getHeatBgColor('medium')}`}></span>
            <span className="text-gray-600">{getHeatLabel('medium')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded ${getHeatBgColor('low')}`}></span>
            <span className="text-gray-600">{getHeatLabel('low')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              货架热力分布
            </h3>
          </div>

          <div className="space-y-6">
            {data.layout.zones.map((zone) => (
              <div
                key={zone.zoneId}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeZone === zone.zoneId
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveZone(activeZone === zone.zoneId ? null : zone.zoneId)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-white rounded-md text-sm font-medium text-gray-700 border border-gray-200">
                      {zone.zoneId}区
                    </span>
                    <span className="text-sm text-gray-600 font-medium">{zone.zoneName}</span>
                    <span className="text-xs text-gray-400">
                      {zone.shelves.length} 个货架
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      activeZone === zone.zoneId ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {(activeZone === zone.zoneId || data.layout.zones.length <= 2) && (
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(...zone.shelves.map(s => s.column), 4)}, minmax(0, 1fr))` }}>
                    {zone.shelves.map((cell) => (
                      <div
                        key={cell.shelfLocation}
                        className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-md ${getHeatColor(
                          cell.heatLevel
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShelfClick(cell);
                        }}
                      >
                        <div className="text-center">
                          <p className="text-sm font-bold">{cell.shelfLocation}</p>
                          <p className="text-xs opacity-75 mt-0.5">
                            {cell.productCount} 种商品
                          </p>
                          {cell.stats && (
                            <p className="text-xs font-medium mt-1">
                              {cell.stats.replenishCount} 次补货
                            </p>
                          )}
                        </div>
                        <div
                          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getHeatBgColor(
                            cell.heatLevel
                          )}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-red-500" />
              TOP 5 高活跃度货架
            </h3>
            <div className="space-y-2">
              {top5Shelves.map((shelf, index) => (
                <div
                  key={shelf.shelfLocation}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getHeatColor(
                    shelf.heatLevel
                  )}`}
                  onClick={() => setSelectedShelf(shelf)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{shelf.shelfLocation}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{shelf.replenishCount} 次</p>
                      <p className="text-xs opacity-75">{shelf.avgDuration}分钟/次</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-green-500" />
              TOP 5 低活跃度货架
            </h3>
            <div className="space-y-2">
              {bottom5Shelves.map((shelf, index) => (
                <div
                  key={shelf.shelfLocation}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getHeatColor(
                    shelf.heatLevel
                  )}`}
                  onClick={() => setSelectedShelf(shelf)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{shelf.shelfLocation}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{shelf.replenishCount} 次</p>
                      <p className="text-xs opacity-75">{shelf.avgDuration}分钟/次</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            陈列调整建议
          </h3>
          <span className="text-xs text-gray-500">
            共 {data.suggestions.length} 条建议
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.suggestions.map((suggestion) => {
            const priority = priorityConfig[suggestion.priority];
            const IconComponent = suggestionTypeIcons[suggestion.type] || Lightbulb;

            return (
              <div
                key={suggestion.id}
                className={`p-4 rounded-xl border ${priority.bg} ${priority.border} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${priority.text}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{suggestion.title}</h4>
                      <span className={`text-xs ${priority.text} font-medium`}>
                        {priority.label}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>

                {(suggestion.fromShelf || suggestion.toShelf) && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    {suggestion.fromShelf && (
                      <span className="px-2 py-1 bg-white/60 rounded text-gray-700 text-xs">
                        {suggestion.fromShelf}
                      </span>
                    )}
                    <MoveRight className="w-4 h-4 text-gray-400" />
                    {suggestion.toShelf && (
                      <span className="px-2 py-1 bg-white/60 rounded text-gray-700 text-xs">
                        {suggestion.toShelf}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-white/50">
                  <div className="flex items-center gap-1 text-xs">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-600">预期收益：</span>
                    <span className="font-medium text-gray-800">
                      {suggestion.expectedBenefit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedShelf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${getHeatBgColor(selectedShelf.heatLevel)} flex items-center justify-center`}>
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedShelf.shelfLocation}
                    </h3>
                    <span className={`text-sm ${getHeatColor(selectedShelf.heatLevel).split(' ')[1]}`}>
                      {getHeatLabel(selectedShelf.heatLevel)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedShelf(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedShelf.replenishCount}
                  </p>
                  <p className="text-xs text-gray-500">补货次数</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedShelf.totalDuration}
                  </p>
                  <p className="text-xs text-gray-500">总耗时(分钟)</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedShelf.avgDuration}
                  </p>
                  <p className="text-xs text-gray-500">平均耗时(分钟)</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">基本信息</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">所属区域</span>
                    <span className="font-medium text-gray-800">
                      {getZoneName(selectedShelf.shelfZone)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">货架位置</span>
                    <span className="font-medium text-gray-800">
                      第 {selectedShelf.shelfRow} 排 - 第 {selectedShelf.shelfColumn} 列
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">商品种类</span>
                    <span className="font-medium text-gray-800">
                      {selectedShelf.products.length} 种
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">补货总量</span>
                    <span className="font-medium text-gray-800">
                      {selectedShelf.totalQuantity} 件
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">货架商品</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedShelf.products.map((product, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white rounded-md text-xs text-gray-700 border border-gray-200"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
