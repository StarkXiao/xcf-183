import type {
  Product,
  ScheduleItem,
  StockSnapshot,
  ShelfReplenishmentRecord,
  ShelfStats,
  ShelfLayout,
  ShelfCell,
  ShelfAdjustmentSuggestion,
  ShelfHeatmapData,
} from '../types';
import { calculateTimeDifference } from './scheduleUtils';

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

export const extractReplenishmentRecords = (
  snapshots: StockSnapshot[],
  products: Product[]
): ShelfReplenishmentRecord[] => {
  const records: ShelfReplenishmentRecord[] = [];

  for (const snapshot of snapshots) {
    const snapshotProducts = snapshot.products.length > 0 ? snapshot.products : products;

    for (const task of snapshot.schedule) {
      if (task.status !== 'completed') {
        continue;
      }

      const product = snapshotProducts.find(p => p.id === task.productId) ||
                      products.find(p => p.id === task.productId);

      if (!product) {
        continue;
      }

      let duration = task.estimatedDuration;
      if (task.actualStartTime && task.actualEndTime) {
        const calculatedDuration = calculateTimeDifference(
          task.actualEndTime,
          task.actualStartTime,
          task.originalTime
        );
        if (calculatedDuration > 0) {
          duration = calculatedDuration;
        }
      }

      records.push({
        id: `rec-${snapshot.date}-${task.id}`,
        shelfLocation: product.shelfLocation,
        productId: product.id,
        productName: product.name,
        replenishTime: task.actualStartTime || task.originalTime,
        quantity: task.quantity,
        duration,
        date: snapshot.date,
      });
    }
  }

  const existingShelfLocations = new Set(
    records.map(r => r.shelfLocation)
  );

  for (const product of products) {
    if (!existingShelfLocations.has(product.shelfLocation)) {
      records.push({
        id: `rec-placeholder-${product.id}`,
        shelfLocation: product.shelfLocation,
        productId: product.id,
        productName: product.name,
        replenishTime: '00:00',
        quantity: 0,
        duration: 0,
        date: new Date().toISOString().split('T')[0],
      });
    }
  }

  return records;
};

export const calculateShelfStats = (
  records: ShelfReplenishmentRecord[],
  products: Product[]
): ShelfStats[] => {
  const shelfMap = new Map<string, ShelfStats>();

  for (const product of products) {
    const { zone, row, column } = parseShelfLocation(product.shelfLocation);

    if (!shelfMap.has(product.shelfLocation)) {
      shelfMap.set(product.shelfLocation, {
        shelfLocation: product.shelfLocation,
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

    const stats = shelfMap.get(product.shelfLocation)!;
    if (!stats.products.includes(product.name)) {
      stats.products.push(product.name);
    }
  }

  for (const record of records) {
    if (record.quantity === 0 && record.duration === 0) {
      continue;
    }

    const stats = shelfMap.get(record.shelfLocation);
    if (!stats) {
      const { zone, row, column } = parseShelfLocation(record.shelfLocation);
      shelfMap.set(record.shelfLocation, {
        shelfLocation: record.shelfLocation,
        shelfZone: zone,
        shelfRow: row,
        shelfColumn: column,
        replenishCount: 1,
        totalDuration: record.duration,
        avgDuration: record.duration,
        totalQuantity: record.quantity,
        heatLevel: 'low',
        products: [record.productName],
      });
    } else {
      stats.replenishCount++;
      stats.totalDuration += record.duration;
      stats.totalQuantity += record.quantity;

      if (!stats.products.includes(record.productName)) {
        stats.products.push(record.productName);
      }
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
  _products: Product[],
  records: ShelfReplenishmentRecord[]
): ShelfAdjustmentSuggestion[] => {
  const suggestions: ShelfAdjustmentSuggestion[] = [];
  const sortedByActivity = [...shelfStats].sort((a, b) => b.replenishCount - a.replenishCount);

  const activeStats = sortedByActivity.filter(s => s.replenishCount > 0);

  if (activeStats.length >= 2) {
    const mostActive = activeStats[0];
    const leastActive = activeStats[activeStats.length - 1];

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
        expectedBenefit: `减少补货耗时约 ${Math.round((ratio - 1) * 10)}%`,
        reason: `根据过去 ${records.filter(r => r.quantity > 0).length} 条真实补货记录，${mostActive.shelfLocation} 补货频次（${mostActive.replenishCount}次）是 ${leastActive.shelfLocation}（${leastActive.replenishCount}次）的 ${Math.round(ratio)} 倍，高周转商品应放在更容易取放的位置`,
      });
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
    if (data.count < minZoneCount && data.count > 0) {
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
      expectedBenefit: `缩短补货路线约 ${Math.round((maxZoneCount / minZoneCount - 1) * 10)}%`,
      reason: `根据历史数据统计，${getZoneName(maxZone)}（${maxZoneCount}次）补货频次远高于 ${getZoneName(minZone)}（${minZoneCount}次），建议将高频区域移至更靠近仓库的位置`,
    });
  }

  const highActivityShelves = shelfStats.filter(s => 
    (s.heatLevel === 'critical' || s.heatLevel === 'high') && s.replenishCount > 0
  );

  if (highActivityShelves.length > 0) {
    const avgQuantityPerReplenish = highActivityShelves.map(s => s.totalQuantity / s.replenishCount);
    const maxAvgQuantity = Math.max(...avgQuantityPerReplenish);
    const minAvgQuantity = Math.min(...avgQuantityPerReplenish);

    if (maxAvgQuantity > minAvgQuantity * 1.5) {
      const lowCapacityShelf = highActivityShelves.find(s => 
        (s.totalQuantity / s.replenishCount) < maxAvgQuantity * 0.6
      );

      if (lowCapacityShelf) {
        const currentAvgQty = Math.round(lowCapacityShelf.totalQuantity / lowCapacityShelf.replenishCount);
        suggestions.push({
          id: 'sug-3',
          type: 'expand_capacity',
          priority: 'medium',
          title: '增加货架容量',
          description: `扩大 ${lowCapacityShelf.shelfLocation} 的货架容量`,
          expectedBenefit: `减少补货次数约 ${Math.round((1 - currentAvgQty / maxAvgQuantity) * 100)}%`,
          reason: `${lowCapacityShelf.shelfLocation} 补货频繁（${lowCapacityShelf.replenishCount}次）但单次补货量（平均${currentAvgQty}件）仅为同热度货架最高值（${Math.round(maxAvgQuantity)}件）的 ${Math.round(currentAvgQty / maxAvgQuantity * 100)}%，增加容量可减少补货频次`,
        });
      }
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
      const avgActiveCount = activeStats.reduce((sum, s) => sum + s.replenishCount, 0) / activeStats.length;
      const slowAvgCount = slowShelves.reduce((sum, s) => sum + s.replenishCount, 0) / slowShelves.length;

      suggestions.push({
        id: 'sug-4',
        type: 'move_low_turnover',
        priority: 'low',
        title: '低周转商品集中',
        description: `将 ${slowProducts.join('、')} 等低周转商品集中摆放`,
        expectedBenefit: `释放优质货架位置约 ${Math.round((1 - slowAvgCount / avgActiveCount) * 100)}%`,
        reason: `低周转商品平均补货仅 ${Math.round(slowAvgCount)} 次，远低于平均 ${Math.round(avgActiveCount)} 次，可集中放在相对不便的位置，腾出黄金位置给高周转商品`,
      });
    }
  }

  if (sortedByActivity.length > 0) {
    const criticalCount = shelfStats.filter(s => s.heatLevel === 'critical').length;
    suggestions.push({
      id: 'sug-5',
      type: 'optimize_path',
      priority: 'medium',
      title: '优化补货路径',
      description: '按照热力图从高到低规划补货顺序',
      expectedBenefit: criticalCount > 0 ? `高峰期减少缺货风险约 ${criticalCount * 5}%` : '提高补货效率约10%',
      reason: `优先处理 ${criticalCount} 个极高热度货架，可在高峰期快速完成重点商品补货，历史数据显示这些货架占总补货量的 ${Math.round(shelfStats.filter(s => s.heatLevel === 'critical').reduce((sum, s) => sum + s.replenishCount, 0) / Math.max(1, shelfStats.reduce((sum, s) => sum + s.replenishCount, 0)) * 100)}%`,
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const generateShelfHeatmapData = (
  products: Product[],
  snapshots: StockSnapshot[],
  currentSchedule?: ScheduleItem[]
): ShelfHeatmapData => {
  const allSnapshots = currentSchedule && currentSchedule.length > 0
    ? [...snapshots, {
        date: new Date().toISOString().split('T')[0],
        products,
        schedule: currentSchedule,
        reminders: [],
        snapshotTime: new Date().toISOString(),
      }]
    : snapshots;

  const records = extractReplenishmentRecords(allSnapshots, products);
  const validRecords = records.filter(r => r.quantity > 0 || r.duration > 0);
  const stats = calculateShelfStats(records, products);
  const layout = generateShelfLayout(products, stats);
  const suggestions = generateAdjustmentSuggestions(stats, products, records);

  const totalReplenishments = stats.reduce((sum, s) => sum + s.replenishCount, 0);
  const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
  const avgReplenishTime = totalReplenishments > 0 ? Math.round(totalDuration / totalReplenishments) : 0;

  const sortedByActivity = [...stats].sort((a, b) => b.replenishCount - a.replenishCount);
  const activeStats = sortedByActivity.filter(s => s.replenishCount > 0);
  const mostActiveShelf = activeStats[0]?.shelfLocation || '-';
  const leastActiveShelf = activeStats[activeStats.length - 1]?.shelfLocation || '-';

  return {
    layout,
    stats,
    suggestions,
    totalReplenishments,
    avgReplenishTime,
    mostActiveShelf,
    leastActiveShelf,
    recordCount: validRecords.length,
    snapshotCount: allSnapshots.length,
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
