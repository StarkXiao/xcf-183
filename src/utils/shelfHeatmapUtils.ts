import type {
  Product,
  ScheduleItem,
  ShelfReplenishmentRecord,
  ShelfStats,
  ShelfLayout,
  ShelfCell,
  ShelfAdjustmentSuggestion,
  ShelfHeatmapData,
} from '../types';

export const parseShelfLocation = (location: string): { zone: string; row: number; column: number } => {
  const match = location.match(/^([A-Z])(\d+)-(\d+)$/);
  if (!match) {
    return { zone: 'A', row: 1, column: 1 };
  }
  return {
    zone: match[1],
    row: parseInt(match[2], 10),
    column: parseInt(match[3], 10),
  };
};

export const getZoneName = (zone: string): string => {
  const zoneNames: Record<string, string> = {
    A: '饮料区',
    B: '鲜食区',
    C: '乳制品区',
    D: '零食区',
    E: '日用品区',
  };
  return zoneNames[zone] || `${zone}区`;
};

const getHeatLevel = (count: number, maxCount: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (maxCount === 0) return 'low';
  const ratio = count / maxCount;
  if (ratio >= 0.8) return 'critical';
  if (ratio >= 0.5) return 'high';
  if (ratio >= 0.25) return 'medium';
  return 'low';
};

export const generateReplenishmentRecords = (
  products: Product[],
  schedule: ScheduleItem[],
  days: number = 7
): ShelfReplenishmentRecord[] => {
  const records: ShelfReplenishmentRecord[] = [];
  const today = new Date();

  for (let day = 0; day < days; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    for (const task of schedule) {
      if (task.status === 'completed' || Math.random() > 0.3) {
        const product = products.find(p => p.id === task.productId);
        if (!product) continue;

        const durationVariation = 0.7 + Math.random() * 0.6;
        const duration = Math.round(task.estimatedDuration * durationVariation);

        records.push({
          id: `rec-${day}-${task.id}`,
          shelfLocation: product.shelfLocation,
          productId: product.id,
          productName: product.name,
          replenishTime: task.originalTime,
          quantity: task.quantity + Math.floor(Math.random() * 5) - 2,
          duration,
          date: dateStr,
        });
      }
    }

    for (const product of products) {
      const extraReplenish = Math.floor(Math.random() * 3);
      for (let i = 0; i < extraReplenish; i++) {
        const hour = 20 + Math.floor(Math.random() * 10);
        const adjustedHour = hour >= 24 ? hour - 24 : hour;
        const minute = Math.floor(Math.random() * 60);

        records.push({
          id: `rec-extra-${day}-${product.id}-${i}`,
          shelfLocation: product.shelfLocation,
          productId: product.id,
          productName: product.name,
          replenishTime: `${String(adjustedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          quantity: Math.floor(product.maxStock * 0.2 + Math.random() * product.maxStock * 0.3),
          duration: 5 + Math.floor(Math.random() * 15),
          date: dateStr,
        });
      }
    }
  }

  return records;
};

export const calculateShelfStats = (
  records: ShelfReplenishmentRecord[],
  _products: Product[]
): ShelfStats[] => {
  const shelfMap = new Map<string, ShelfStats>();

  for (const record of records) {
    const { zone, row, column } = parseShelfLocation(record.shelfLocation);

    if (!shelfMap.has(record.shelfLocation)) {
      shelfMap.set(record.shelfLocation, {
        shelfLocation: record.shelfLocation,
        shelfZone: zone,
        shelfRow: row,
        shelfColumn: column,
        replenishCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        totalQuantity: 0,
        heatLevel: 'low',
        products: [],
      });
    }

    const stats = shelfMap.get(record.shelfLocation)!;
    stats.replenishCount++;
    stats.totalDuration += record.duration;
    stats.totalQuantity += record.quantity;

    if (!stats.products.includes(record.productName)) {
      stats.products.push(record.productName);
    }
  }

  const statsArray = Array.from(shelfMap.values());

  for (const stats of statsArray) {
    stats.avgDuration = stats.replenishCount > 0
      ? Math.round(stats.totalDuration / stats.replenishCount)
      : 0;
  }

  const maxCount = Math.max(...statsArray.map(s => s.replenishCount), 1);

  for (const stats of statsArray) {
    stats.heatLevel = getHeatLevel(stats.replenishCount, maxCount);
  }

  return statsArray;
};

export const generateShelfLayout = (
  products: Product[],
  shelfStats: ShelfStats[]
): ShelfLayout => {
  const zones = new Map<string, { rows: number; columns: number; cells: Map<string, ShelfCell> }>();

  for (const product of products) {
    const { zone, row, column } = parseShelfLocation(product.shelfLocation);

    if (!zones.has(zone)) {
      zones.set(zone, { rows: 0, columns: 0, cells: new Map() });
    }

    const zoneData = zones.get(zone)!;
    zoneData.rows = Math.max(zoneData.rows, row);
    zoneData.columns = Math.max(zoneData.columns, column);

    const cellKey = `${row}-${column}`;
    if (!zoneData.cells.has(cellKey)) {
      const stats = shelfStats.find(s => s.shelfLocation === product.shelfLocation);
      zoneData.cells.set(cellKey, {
        shelfLocation: product.shelfLocation,
        row,
        column,
        zone,
        productCount: 0,
        heatLevel: stats?.heatLevel || 'low',
        stats,
      });
    }

    const cell = zoneData.cells.get(cellKey)!;
    cell.productCount++;
  }

  const layoutZones = Array.from(zones.entries()).map(([zoneId, zoneData]) => ({
    zoneId,
    zoneName: getZoneName(zoneId),
    shelves: Array.from(zoneData.cells.values()).sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.column - b.column;
    }),
  }));

  let maxRows = 0;
  let maxColumns = 0;
  for (const zone of zones.values()) {
    maxRows = Math.max(maxRows, zone.rows);
    maxColumns = Math.max(maxColumns, zone.columns);
  }

  return {
    zones: layoutZones,
    rows: maxRows,
    columns: maxColumns,
  };
};

export const generateAdjustmentSuggestions = (
  shelfStats: ShelfStats[],
  _products: Product[]
): ShelfAdjustmentSuggestion[] => {
  const suggestions: ShelfAdjustmentSuggestion[] = [];
  const sortedByActivity = [...shelfStats].sort((a, b) => b.replenishCount - a.replenishCount);

  if (sortedByActivity.length >= 2) {
    const mostActive = sortedByActivity[0];
    const leastActive = sortedByActivity[sortedByActivity.length - 1];

    if (mostActive.replenishCount > 0 && leastActive.replenishCount > 0) {
      const ratio = mostActive.replenishCount / leastActive.replenishCount;

      if (ratio > 3) {
        const highTurnoverProduct = mostActive.products[0];
        suggestions.push({
          id: 'sug-1',
          type: 'move_high_turnover',
          priority: 'high',
          title: '高周转商品移位',
          description: `将 ${highTurnoverProduct} 移至更易取放的位置`,
          fromShelf: mostActive.shelfLocation,
          toShelf: leastActive.shelfLocation,
          productName: highTurnoverProduct,
          expectedBenefit: '减少补货耗时约20%',
          reason: `${mostActive.shelfLocation} 补货频次是 ${leastActive.shelfLocation} 的 ${Math.round(ratio)} 倍，高周转商品应放在更容易取放的位置`,
        });
      }
    }
  }

  const zoneStats = new Map<string, { count: number; duration: number }>();
  for (const stats of shelfStats) {
    if (!zoneStats.has(stats.shelfZone)) {
      zoneStats.set(stats.shelfZone, { count: 0, duration: 0 });
    }
    const zone = zoneStats.get(stats.shelfZone)!;
    zone.count += stats.replenishCount;
    zone.duration += stats.totalDuration;
  }

  let maxZoneCount = 0;
  let maxZone = '';
  let minZoneCount = Infinity;
  let minZone = '';

  for (const [zone, data] of zoneStats.entries()) {
    if (data.count > maxZoneCount) {
      maxZoneCount = data.count;
      maxZone = zone;
    }
    if (data.count < minZoneCount) {
      minZoneCount = data.count;
      minZone = zone;
    }
  }

  if (maxZone && minZone && maxZone !== minZone && maxZoneCount > minZoneCount * 2) {
    suggestions.push({
      id: 'sug-2',
      type: 'rearrange_zone',
      priority: 'medium',
      title: '区域布局优化',
      description: `调整 ${getZoneName(maxZone)} 和 ${getZoneName(minZone)} 的位置`,
      expectedBenefit: '缩短补货路线约15%',
      reason: `${getZoneName(maxZone)} 补货频次远高于 ${getZoneName(minZone)}，建议将高频区域移至更靠近仓库的位置`,
    });
  }

  const highActivityShelves = shelfStats.filter(s => s.heatLevel === 'critical' || s.heatLevel === 'high');
  if (highActivityShelves.length > 0) {
    const maxCapacity = Math.max(...highActivityShelves.map(s => s.totalQuantity / s.replenishCount));
    const lowCapacityShelf = highActivityShelves.find(s => (s.totalQuantity / s.replenishCount) < maxCapacity * 0.6);

    if (lowCapacityShelf) {
      suggestions.push({
        id: 'sug-3',
        type: 'expand_capacity',
        priority: 'medium',
        title: '增加货架容量',
        description: `扩大 ${lowCapacityShelf.shelfLocation} 的货架容量`,
        expectedBenefit: '减少补货次数约25%',
        reason: `${lowCapacityShelf.shelfLocation} 补货频繁但单次补货量较小，增加容量可减少补货频次`,
      });
    }
  }

  const slowShelves = shelfStats.filter(s => s.heatLevel === 'low' && s.replenishCount > 0);
  if (slowShelves.length >= 2) {
    const slowProducts: string[] = [];
    for (const shelf of slowShelves.slice(0, 2)) {
      if (shelf.products.length > 0) {
        slowProducts.push(shelf.products[0]);
      }
    }

    if (slowProducts.length > 0) {
      suggestions.push({
        id: 'sug-4',
        type: 'move_low_turnover',
        priority: 'low',
        title: '低周转商品集中',
        description: `将 ${slowProducts.join('、')} 等低周转商品集中摆放`,
        expectedBenefit: '释放优质货架位置约10%',
        reason: '低周转商品补货频次低，可集中放在相对不便的位置，腾出黄金位置给高周转商品',
      });
    }
  }

  suggestions.push({
    id: 'sug-5',
    type: 'optimize_path',
    priority: 'medium',
    title: '优化补货路径',
    description: '按照热力图从高到低规划补货顺序',
    expectedBenefit: '提高补货效率约10%',
    reason: '优先处理高热度货架，可在高峰期快速完成重点商品补货，减少缺货风险',
  });

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const generateShelfHeatmapData = (
  products: Product[],
  schedule: ScheduleItem[],
  days: number = 7
): ShelfHeatmapData => {
  const records = generateReplenishmentRecords(products, schedule, days);
  const stats = calculateShelfStats(records, products);
  const layout = generateShelfLayout(products, stats);
  const suggestions = generateAdjustmentSuggestions(stats, products);

  const totalReplenishments = stats.reduce((sum, s) => sum + s.replenishCount, 0);
  const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
  const avgReplenishTime = totalReplenishments > 0 ? Math.round(totalDuration / totalReplenishments) : 0;

  const sortedByActivity = [...stats].sort((a, b) => b.replenishCount - a.replenishCount);
  const mostActiveShelf = sortedByActivity[0]?.shelfLocation || '-';
  const leastActiveShelf = sortedByActivity[sortedByActivity.length - 1]?.shelfLocation || '-';

  return {
    layout,
    stats,
    suggestions,
    totalReplenishments,
    avgReplenishTime,
    mostActiveShelf,
    leastActiveShelf,
  };
};

export const getHeatColor = (level: 'low' | 'medium' | 'high' | 'critical'): string => {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[level];
};

export const getHeatBgColor = (level: 'low' | 'medium' | 'high' | 'critical'): string => {
  const colors = {
    low: 'bg-green-400',
    medium: 'bg-yellow-400',
    high: 'bg-orange-400',
    critical: 'bg-red-500',
  };
  return colors[level];
};

export const getHeatLabel = (level: 'low' | 'medium' | 'high' | 'critical'): string => {
  const labels = {
    low: '低活跃度',
    medium: '中活跃度',
    high: '高活跃度',
    critical: '极高活跃度',
  };
  return labels[level];
};
