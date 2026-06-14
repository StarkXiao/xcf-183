import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Cloud,
  CloudRain,
  Sun,
  Snowflake,
  ThermometerSun,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  BarChart3,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import type {
  ForecastResult,
  ReplenishmentSuggestion,
  WeatherCondition,
  WeatherData,
  HolidayInfo,
} from '../types';
import { getWeatherConditionLabel } from '../utils/forecastUtils';

interface ReplenishmentForecastProps {
  forecast: ForecastResult;
  onReplenish?: (productId: string, quantity: number) => void;
  onRefresh?: () => void;
}

const priorityConfig = {
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: '紧急',
    icon: AlertTriangle,
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    label: '高优先',
    icon: TrendingUp,
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    label: '中优先',
    icon: Clock,
  },
  low: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    label: '低优先',
    icon: CheckCircle2,
  },
};

const weatherIcons: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: Snowflake,
  hot: ThermometerSun,
  cold: Snowflake,
  stormy: CloudRain,
};

const categoryLabels: Record<string, string> = {
  beverage: '饮料',
  rice_ball: '鲜食',
  expiring: '临期',
};

export default function ReplenishmentForecast({
  forecast,
  onReplenish,
  onRefresh,
}: ReplenishmentForecastProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredSuggestions = useMemo(() => {
    return forecast.suggestions.filter((s) => {
      const matchPriority = filterPriority === 'all' || s.priority === filterPriority;
      const matchCategory = filterCategory === 'all' || s.category === filterCategory;
      return matchPriority && matchCategory;
    });
  }, [forecast.suggestions, filterPriority, filterCategory]);

  const topSuggestions = useMemo(() => {
    return filteredSuggestions.filter((s) => s.suggestedQuantity > 0).slice(0, 10);
  }, [filteredSuggestions]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleReplenish = (suggestion: ReplenishmentSuggestion) => {
    if (onReplenish && suggestion.suggestedQuantity > 0) {
      onReplenish(suggestion.productId, suggestion.suggestedQuantity);
    }
  };

  const renderWeatherCard = (weather: WeatherData) => {
    const WeatherIcon = weatherIcons[weather.condition] || Sun;
    return (
      <div
        key={weather.date}
        className="flex-shrink-0 w-24 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 text-center"
      >
        <p className="text-xs text-gray-500 mb-2">
          {weather.date === forecast.forecastDate ? '今天' : weather.date.slice(5)}
        </p>
        <WeatherIcon className="w-6 h-6 mx-auto text-blue-500 mb-1" />
        <p className="text-lg font-bold text-gray-800">{Math.round(weather.temperature)}°</p>
        <p className="text-xs text-gray-500">{getWeatherConditionLabel(weather.condition)}</p>
      </div>
    );
  };

  const renderHolidayTag = (holiday: HolidayInfo) => {
    const colorMap = {
      national: 'bg-red-100 text-red-700 border-red-200',
      local: 'bg-purple-100 text-purple-700 border-purple-200',
      weekend: 'bg-blue-100 text-blue-700 border-blue-200',
      workday: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span
        key={holiday.date}
        className={`px-2 py-0.5 text-xs rounded-full border ${colorMap[holiday.type]}`}
      >
        {holiday.name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">智能补货预测</h2>
              <p className="text-sm text-gray-500">
                基于历史销量、天气和节假日的 AI 预测 · 未来 {forecast.forecastPeriodDays} 天
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新预测
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">紧急补货</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{forecast.summary.criticalItems}</p>
            <p className="text-xs text-gray-500">需立即处理</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">建议补货</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{forecast.totalSuggestedQuantity}</p>
            <p className="text-xs text-gray-500">总件数</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">预计成本</span>
            </div>
            <p className="text-2xl font-bold text-green-600">¥{forecast.totalEstimatedCost.toFixed(0)}</p>
            <p className="text-xs text-gray-500">进货成本估算</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500">预测置信度</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(forecast.summary.averageConfidence * 100)}%
            </p>
            <p className="text-xs text-gray-500">平均置信度</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">天气预测</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {forecast.weatherForecast.map(renderWeatherCard)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">节假日影响</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.holidays.map(renderHolidayTag)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-800">建议补货清单</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {filteredSuggestions.length} 项
            </span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <Info className="w-4 h-4" />
            {showDetails ? '隐藏详情' : '显示详情'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">优先级：</span>
          </div>
          {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                filterPriority === p
                  ? 'bg-teal-100 text-teal-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'all' ? '全部' : priorityConfig[p as keyof typeof priorityConfig]?.label}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">分类：</span>
          </div>
          {['all', 'beverage', 'rice_ball', 'expiring'].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                filterCategory === c
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c === 'all' ? '全部' : categoryLabels[c] || c}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {topSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-2" />
              <p className="text-gray-500">所有商品库存充足，暂无补货需求</p>
            </div>
          ) : (
            topSuggestions.map((suggestion) => {
              const config = priorityConfig[suggestion.priority];
              const PriorityIcon = config.icon;
              const isExpanded = expandedId === suggestion.id;
              const stockPercentage = (suggestion.currentStock / suggestion.maxStock) * 100;

              return (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-xl border transition-all ${config.bg} ${config.border}`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(suggestion.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${config.badge} flex items-center justify-center`}>
                        <PriorityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">
                            {suggestion.productName}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${config.badge}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            货架：{suggestion.shelfLocation}
                          </span>
                          <span className="text-xs text-gray-500">
                            {categoryLabels[suggestion.category] || suggestion.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">
                          {suggestion.suggestedQuantity > 0 ? (
                            <>+{suggestion.suggestedQuantity}</>
                          ) : (
                            <span className="text-green-600">充足</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">建议补货</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">当前库存</p>
                          <p className="text-base font-semibold text-gray-800">
                            {suggestion.currentStock}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">最大库存</p>
                          <p className="text-base font-semibold text-gray-800">
                            {suggestion.maxStock}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">预测需求</p>
                          <p className="text-base font-semibold text-blue-600">
                            {suggestion.predictedDemand}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">安全库存</p>
                          <p className="text-base font-semibold text-amber-600">
                            {suggestion.safetyStock}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>库存水平</span>
                          <span>{Math.round(stockPercentage)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stockPercentage < 20
                                ? 'bg-red-500'
                                : stockPercentage < 40
                                  ? 'bg-orange-500'
                                  : stockPercentage < 70
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                            }`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      </div>

                      {showDetails && (
                        <div className="bg-white/60 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-gray-700">影响因素分析：</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">历史销量因素</span>
                              <span className="font-medium text-gray-700">
                                {suggestion.factors.historicalSales} 件
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">天气影响系数</span>
                              <span
                                className={`font-medium ${
                                  suggestion.factors.weatherImpact > 1
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                                }`}
                              >
                                {suggestion.factors.weatherImpact > 1 ? '↑' : '↓'}{' '}
                                {suggestion.factors.weatherImpact.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">节假日影响</span>
                              <span
                                className={`font-medium ${
                                  suggestion.factors.holidayImpact > 1
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {suggestion.factors.holidayImpact > 1 ? '↑' : '↓'}{' '}
                                {suggestion.factors.holidayImpact.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">趋势影响</span>
                              <span
                                className={`font-medium ${
                                  suggestion.factors.trendImpact > 1
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }`}
                              >
                                {suggestion.factors.trendImpact > 1 ? '↑' : '↓'}{' '}
                                {suggestion.factors.trendImpact.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            预计售罄：
                            <span className="font-medium text-gray-700">
                              {suggestion.expectedSellThroughDays} 天
                            </span>
                          </span>
                          <span>
                            置信度：
                            <span className="font-medium text-purple-600">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </span>
                        </div>
                        {onReplenish && suggestion.suggestedQuantity > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplenish(suggestion);
                            }}
                            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            一键补货
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 bg-white/40 px-3 py-2 rounded-lg">
                        💡 {suggestion.reason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {filteredSuggestions.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              显示前 10 项，共 {filteredSuggestions.length} 项建议
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
