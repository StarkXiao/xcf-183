import { useMemo } from 'react';
import type { Product, Reminder, StockSnapshot } from '../types';
import { getExpiryStatistics, generateExpiryReminders } from '../utils/expiryUtils';

export function useExpiration(
  products: Product[],
  reminders: Reminder[],
  selectedSnapshot: StockSnapshot | null
) {
  const expiryStatistics = useMemo(
    () => getExpiryStatistics(products),
    [products]
  );

  const effectiveReminders = useMemo(() => {
    if (selectedSnapshot) return selectedSnapshot.reminders;
    return generateExpiryReminders(products, reminders);
  }, [selectedSnapshot, products, reminders]);

  return { expiryStatistics, effectiveReminders };
}
