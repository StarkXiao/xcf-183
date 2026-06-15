import { useState, useMemo } from 'react';
import type { StockSnapshot } from '../types';
import { loadAllSnapshots } from '../utils/historyUtils';

export function useHistoryDomain(mockSnapshots: StockSnapshot[]) {
  const [snapshots, setSnapshots] = useState<StockSnapshot[]>(() => {
    const stored = loadAllSnapshots();
    if (stored.length === 0) return mockSnapshots;
    const existingDates = new Set(mockSnapshots.map(s => s.date));
    const newOnes = stored.filter(s => !existingDates.has(s.date));
    return [...mockSnapshots, ...newOnes];
  });
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

  const selectedSnapshot = useMemo(() => {
    if (!selectedHistoryDate) return null;
    return snapshots.find(s => s.date === selectedHistoryDate) || null;
  }, [snapshots, selectedHistoryDate]);

  const isHistoryMode = !!selectedHistoryDate;

  return {
    snapshots,
    setSnapshots,
    selectedHistoryDate,
    setSelectedHistoryDate,
    selectedSnapshot,
    isHistoryMode,
  };
}
