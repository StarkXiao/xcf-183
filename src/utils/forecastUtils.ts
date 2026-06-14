import type {
  Product,
  StockSnapshot,
  WeatherData,
  WeatherCondition,
  HolidayInfo,
  SalesRecord,
  SalesTrend,
  ReplenishmentSuggestion,
  ForecastResult,
  ForecastConfig,
} from '../types';
import { formatDate, parseDate } from './historyUtils';

const DEFAULT_CONFIG: ForecastConfig = {
  forecastDays: 3,
  safetyStockRatio: 0.3,
  historyDays: 14,
  weatherWeight: 0.15,
  holidayWeight: 0.2,
  trendWeight: 0.1,
  minConfidenceThreshold: 0.6,
};

const WEATHER_CONDITION_LABELS: Record<WeatherCondition, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
  snowy: '雪天',
  hot: '高温',
  cold: '低温',
  stormy: '暴风雨',
};

const CATEGORY_WEATHER_SENSITIVITY: Record<string, Record<WeatherCondition, number>> = {
  beverage: {
    sunny: 1.15,
    cloudy: 1.0,
    rainy: 0.85,
    snowy: 0.7,
    hot: 1.4,
    cold: 0.6,
    stormy: 0.5,
  },
  rice_ball: {
    sunny: 1.05,
    cloudy: 1.0,
    rainy: 1.15,
    snowy: 0.8,
    hot: 0.9,
    cold: 0.85,
    stormy: 0.6,
  },
  expiring: {
    sunny: 1.0,
    cloudy: 1.0,
    rainy: 0.9,
    snowy: 0.75,
    hot: 1.1,
    cold: 0.8,
    stormy: 0.55,
  },
};

const HOLIDAY_IMPACT_FACTORS: Record<string, number> = {
  '元旦': 1.3,
  '春节': 1.8,
  '清明节': 1.2,
  '劳动节': 1.5,
  '端午节': 1.4,
  '中秋节': 1.4,
  '国庆节': 1.7,
  '周末': 1.25,
  '工作日': 1.0,
  '调休工作日': 0.9,
};

export const getWeatherConditionLabel = (condition: WeatherCondition): string => {
  return WEATHER_CONDITION_LABELS[condition] || condition;
};

export const generateWeatherForecast = (days: number, startDate?: string): WeatherData[] => {
  const forecast: WeatherData[] = [];
  const baseDate = startDate ? parseDate(startDate) : new Date();
  
  const conditions: WeatherCondition[] = ['sunny', 'cloudy', 'rainy', 'sunny', 'cloudy', 'hot', 'sunny'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    const conditionIndex = (i + Math.floor(Math.random() * 3)) % conditions.length;
    const baseTemp = 25 + Math.sin(i * 0.5) * 5;
    const tempVariation = (Math.random() - 0.5) * 6;
    
    forecast.push({
      date: formatDate(date),
      condition: conditions[conditionIndex],
      temperature: Math.round((baseTemp + tempVariation) * 10) / 10,
      humidity: Math.round((60 + Math.random() * 30) * 10) / 10,
      windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
      precipitation: conditions[conditionIndex] === 'rainy' || conditions[conditionIndex] === 'stormy'
        ? Math.round((5 + Math.random() * 20) * 10) / 10
        : 0,
    });
  }
  
  return forecast;
};

export const generateHolidays = (startDate: string, days: number): HolidayInfo[] => {
  const holidays: HolidayInfo[] = [];
  const base = parseDate(startDate);
  
  const holidayPool: { name: string; type: HolidayInfo['type']; impact: HolidayInfo['impactLevel'] }[] = [
    { name: '周末', type: 'weekend', impact: 'medium' },
    { name: '工作日', type: 'workday', impact: 'low' },
    { name: '调休工作日', type: 'workday', impact: 'low' },
  ];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(base);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = isWeekend ? holidayPool[0] : holidayPool[1];
    
    holidays.push({
      date: formatDate(date),
      name: holiday.name,
      type: holiday.type,
      impactLevel: holiday.impact,
    });
  }
  
  return holidays;
};

export const calculateDailySalesFromSnapshots = (
  snapshots: StockSnapshot[],
  products: Product[]
): SalesRecord[] => {
  const salesRecords: SalesRecord[] = [];
  
  if (snapshots.length < 2) {
    return products.map(p => ({
      date: formatDate(new Date()),
      productId: p.id,
      productName: p.name,
      quantity: Math.floor(p.maxStock * 0.4 + Math.random() * p.maxStock * 0.2),
      revenue: 0,
    }));
  }
  
  const sortedSnapshots = [...snapshots].sort((a, b) => 
    parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );
  
  for (let i = 1; i < sortedSnapshots.length; i++) {
    const prev = sortedSnapshots[i - 1];
    const curr = sortedSnapshots[i];
    
    for (const product of products) {
      const prevProduct = prev.products.find(p => p.id === product.id);
      const currProduct = curr.products.find(p => p.id === product.id);
      
      if (prevProduct && currProduct) {
        const completedTasks = curr.schedule.filter(
          s => s.productId === product.id && s.status === 'completed'
        );
        const replenishedQty = completedTasks.reduce((sum, s) => sum + s.quantity, 0);
        
        const salesQty = Math.max(0, prevProduct.stock + replenishedQty - currProduct.stock);
        
        salesRecords.push({
          date: curr.date,
          productId: product.id,
          productName: product.name,
          quantity: salesQty,
          revenue: salesQty * product.price,
        });
      }
    }
  }
  
  return salesRecords;
};

export const calculateSalesTrends = (
  salesRecords: SalesRecord[],
  products: Product[]
): Map<string, SalesTrend> => {
  const trends = new Map<string, SalesTrend>();
  
  for (const product of products) {
    const productSales = salesRecords.filter(s => s.productId === product.id);
    
    if (productSales.length === 0) {
      trends.set(product.id, {
        productId: product.id,
        productName: product.name,
        averageDailySales: product.maxStock * 0.4,
        trendDirection: 'stable',
        trendRate: 0,
        volatility: 0.2,
        weekendBoost: 1.2,
        holidayBoost: 1.3,
        weatherSensitivity: CATEGORY_WEATHER_SENSITIVITY[product.category] || CATEGORY_WEATHER_SENSITIVITY.beverage,
      });
      continue;
    }
    
    const totalSales = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const averageDailySales = totalSales / productSales.length;
    
    const midPoint = Math.floor(productSales.length / 2);
    const firstHalf = productSales.slice(0, midPoint);
    const secondHalf = productSales.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, s) => sum + s.quantity, 0) / firstHalf.length 
      : averageDailySales;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, s) => sum + s.quantity, 0) / secondHalf.length
      : averageDailySales;
    
    const trendRate = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;
    const trendDirection = trendRate > 0.05 ? 'up' : trendRate < -0.05 ? 'down' : 'stable';
    
    const variance = productSales.reduce((sum, s) => {
      const diff = s.quantity - averageDailySales;
      return sum + diff * diff;
    }, 0) / productSales.length;
    const volatility = averageDailySales > 0 ? Math.sqrt(variance) / averageDailySales : 0.2;
    
    trends.set(product.id, {
      productId: product.id,
      productName: product.name,
      averageDailySales,
      trendDirection,
      trendRate,
      volatility: Math.min(volatility, 0.8),
      weekendBoost: 1.2,
      holidayBoost: 1.3,
      weatherSensitivity: CATEGORY_WEATHER_SENSITIVITY[product.category] || CATEGORY_WEATHER_SENSITIVITY.beverage,
    });
  }
  
  return trends;
};

export const calculateWeatherImpact = (
  forecast: WeatherData[],
  trend: SalesTrend
): number => {
  if (forecast.length === 0) return 1.0;
  
  let totalImpact = 0;
  
  for (const weather of forecast) {
    let impact = trend.weatherSensitivity[weather.condition] || 1.0;
    
    if (weather.temperature > 30) {
      impact *= 1.1;
    } else if (weather.temperature < 10) {
      impact *= 0.9;
    }
    
    if (weather.precipitation > 10) {
      impact *= 0.9;
    }
    
    totalImpact += impact;
  }
  
  return totalImpact / forecast.length;
};

export const calculateHolidayImpact = (
  holidays: HolidayInfo[]
): number => {
  if (holidays.length === 0) return 1.0;
  
  let totalImpact = 0;
  
  for (const holiday of holidays) {
    const factor = HOLIDAY_IMPACT_FACTORS[holiday.name] || 1.0;
    
    const impactMultiplier = {
      low: 1.0,
      medium: 1.1,
      high: 1.2,
      extreme: 1.4,
    }[holiday.impactLevel];
    
    totalImpact += factor * impactMultiplier;
  }
  
  return totalImpact / holidays.length;
};

export const calculateTrendImpact = (trend: SalesTrend, days: number): number => {
  const dailyTrendRate = trend.trendRate / 7;
  const compoundGrowth = Math.pow(1 + dailyTrendRate, days);
  return Math.max(0.7, Math.min(1.5, compoundGrowth));
};

export const calculatePredictedDemand = (
  trend: SalesTrend,
  weatherForecast: WeatherData[],
  holidays: HolidayInfo[],
  config: ForecastConfig
): { dailyDemand: number; totalDemand: number; factors: { weather: number; holiday: number; trend: number } } => {
  const baseDemand = trend.averageDailySales;
  
  const weatherImpact = calculateWeatherImpact(weatherForecast, trend);
  const holidayImpact = calculateHolidayImpact(holidays);
  const trendImpact = calculateTrendImpact(trend, config.forecastDays);
  
  const adjustedDemand = baseDemand * 
    Math.pow(weatherImpact, config.weatherWeight) *
    Math.pow(holidayImpact, config.holidayWeight) *
    Math.pow(trendImpact, config.trendWeight);
  
  return {
    dailyDemand: adjustedDemand,
    totalDemand: adjustedDemand * config.forecastDays,
    factors: {
      weather: weatherImpact,
      holiday: holidayImpact,
      trend: trendImpact,
    },
  };
};

export const calculateSafetyStock = (
  trend: SalesTrend,
  config: ForecastConfig
): number => {
  const baseSafety = trend.averageDailySales * config.safetyStockRatio;
  const volatilityAdjustment = 1 + trend.volatility;
  return Math.ceil(baseSafety * volatilityAdjustment);
};

export const calculateConfidence = (
  historyDays: number,
  availableDays: number,
  volatility: number
): number => {
  const dataCompleteness = Math.min(1, availableDays / historyDays);
  const volatilityPenalty = volatility * 0.3;
  const baseConfidence = 0.7 + dataCompleteness * 0.2 - volatilityPenalty;
  return Math.max(0.4, Math.min(0.98, baseConfidence));
};

const generatePriorityReason = (
  _stockRatio: number,
  _predictedDemand: number,
  priority: string
): string => {
  const reasons: Record<string, string[]> = {
    critical: [
      '库存严重不足，急需补货',
      '销量预测高，库存即将耗尽',
      '库存低于安全线，存在断货风险',
    ],
    high: [
      '库存偏低，建议补货',
      '预计未来几天销量上升，需提前备货',
      '库存接近安全线，建议补充',
    ],
    medium: [
      '库存适中，可按需补货',
      '销量平稳，可按常规节奏补货',
      '库存状况良好，可考虑适量补充',
    ],
    low: [
      '库存充足，暂不需要补货',
      '当前库存可满足需求',
      '库存充裕，建议观察后再决定',
    ],
  };
  
  const reasonList = reasons[priority] || reasons.medium;
  return reasonList[Math.floor(Math.random() * reasonList.length)];
};

export const generateReplenishmentSuggestion = (
  product: Product,
  trend: SalesTrend,
  weatherForecast: WeatherData[],
  holidays: HolidayInfo[],
  config: ForecastConfig,
  availableHistoryDays: number
): ReplenishmentSuggestion => {
  const { dailyDemand, totalDemand, factors } = calculatePredictedDemand(
    trend,
    weatherForecast,
    holidays,
    config
  );
  
  const safetyStock = calculateSafetyStock(trend, config);
  const targetStock = Math.ceil(totalDemand + safetyStock);
  const neededQuantity = Math.max(0, targetStock - product.stock);
  const suggestedQuantity = Math.min(neededQuantity, product.maxStock - product.stock);
  
  const confidence = calculateConfidence(config.historyDays, availableHistoryDays, trend.volatility);
  
  const stockRatio = product.stock / product.maxStock;
  
  let priority: ReplenishmentSuggestion['priority'];
  if (stockRatio < 0.15 || (product.stock < dailyDemand && suggestedQuantity > 0)) {
    priority = 'critical';
  } else if (stockRatio < 0.3 || suggestedQuantity > product.maxStock * 0.3) {
    priority = 'high';
  } else if (stockRatio < 0.6 || suggestedQuantity > 0) {
    priority = 'medium';
  } else {
    priority = 'low';
  }
  
  const unitCost = product.price * 0.6;
  const estimatedCost = Math.round(suggestedQuantity * unitCost * 100) / 100;
  
  const expectedSellThroughDays = dailyDemand > 0 
    ? Math.round((product.stock + suggestedQuantity) / dailyDemand * 10) / 10 
    : 999;
  
  return {
    id: `suggestion-${product.id}-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock: product.stock,
    maxStock: product.maxStock,
    suggestedQuantity: Math.max(0, suggestedQuantity),
    predictedDemand: Math.round(totalDemand),
    safetyStock,
    confidence: Math.round(confidence * 100) / 100,
    priority,
    reason: generatePriorityReason(stockRatio, totalDemand, priority),
    factors: {
      historicalSales: Math.round(totalDemand * 0.7),
      weatherImpact: Math.round(factors.weather * 100) / 100,
      holidayImpact: Math.round(factors.holiday * 100) / 100,
      trendImpact: Math.round(factors.trend * 100) / 100,
    },
    shelfLocation: product.shelfLocation,
    price: product.price,
    estimatedCost,
    expectedSellThroughDays,
  };
};

export const generateForecast = (
  products: Product[],
  snapshots: StockSnapshot[],
  config: Partial<ForecastConfig> = {}
): ForecastResult => {
  const fullConfig: ForecastConfig = { ...DEFAULT_CONFIG, ...config };
  
  const forecastDate = formatDate(new Date());
  const weatherForecast = generateWeatherForecast(fullConfig.forecastDays, forecastDate);
  const holidays = generateHolidays(forecastDate, fullConfig.forecastDays);
  
  const salesRecords = calculateDailySalesFromSnapshots(snapshots, products);
  const salesTrends = calculateSalesTrends(salesRecords, products);
  
  const availableHistoryDays = Math.min(
    fullConfig.historyDays,
    new Set(salesRecords.map(s => s.date)).size || 7
  );
  
  const suggestions: ReplenishmentSuggestion[] = [];
  
  for (const product of products) {
    const trend = salesTrends.get(product.id);
    if (trend) {
      const suggestion = generateReplenishmentSuggestion(
        product,
        trend,
        weatherForecast,
        holidays,
        fullConfig,
        availableHistoryDays
      );
      
      if (suggestion.suggestedQuantity > 0 || suggestion.priority !== 'low') {
        suggestions.push(suggestion);
      }
    }
  }
  
  suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.suggestedQuantity - a.suggestedQuantity;
  });
  
  const totalSuggestedQuantity = suggestions.reduce((sum, s) => sum + s.suggestedQuantity, 0);
  const totalEstimatedCost = Math.round(suggestions.reduce((sum, s) => sum + s.estimatedCost, 0) * 100) / 100;
  
  const criticalItems = suggestions.filter(s => s.priority === 'critical').length;
  const highPriorityItems = suggestions.filter(s => s.priority === 'high').length;
  const mediumPriorityItems = suggestions.filter(s => s.priority === 'medium').length;
  const lowPriorityItems = suggestions.filter(s => s.priority === 'low').length;
  const averageConfidence = suggestions.length > 0
    ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length * 100) / 100
    : 0;
  
  return {
    forecastDate,
    forecastPeriodDays: fullConfig.forecastDays,
    suggestions,
    totalSuggestedQuantity,
    totalEstimatedCost,
    weatherForecast,
    holidays,
    summary: {
      criticalItems,
      highPriorityItems,
      mediumPriorityItems,
      lowPriorityItems,
      averageConfidence,
    },
  };
};

export const getTopSuggestions = (
  forecast: ForecastResult,
  limit: number = 10
): ReplenishmentSuggestion[] => {
  return forecast.suggestions.slice(0, limit);
};

export const getSuggestionsByPriority = (
  forecast: ForecastResult,
  priority: ReplenishmentSuggestion['priority']
): ReplenishmentSuggestion[] => {
  return forecast.suggestions.filter(s => s.priority === priority);
};

export const getSuggestionsByCategory = (
  forecast: ForecastResult,
  category: string
): ReplenishmentSuggestion[] => {
  return forecast.suggestions.filter(s => s.category === category);
};

export const exportReplenishmentList = (
  forecast: ForecastResult
): { productName: string; quantity: number; unit: string; shelfLocation: string; priority: string }[] => {
  return forecast.suggestions
    .filter(s => s.suggestedQuantity > 0)
    .map(s => ({
      productName: s.productName,
      quantity: s.suggestedQuantity,
      unit: s.category === 'beverage' ? '瓶/盒' : '个',
      shelfLocation: s.shelfLocation,
      priority: s.priority,
    }));
};
