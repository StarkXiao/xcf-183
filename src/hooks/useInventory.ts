import { useMemo, useCallback } from 'react';
import type { Product } from '../types';

interface StockStatus {
  color: string;
  status: string;
}

export function useInventory(products: Product[]) {
  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock < p.maxStock * 0.3),
    [products]
  );

  const expiredProducts = useMemo(
    () => products.filter(p => p.expirationDate && new Date(p.expirationDate) <= new Date()),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter(p => !!p.outOfStockRegistered),
    [products]
  );

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + p.stock, 0),
    [products]
  );

  const calculateReplenish = useCallback((product: Product): number => {
    return product.maxStock - product.stock;
  }, []);

  const isOverCapacity = useCallback((product: Product, amount: number): boolean => {
    return product.stock + amount > product.maxStock;
  }, []);

  const getStockStatus = useCallback((stock: number, maxStock: number): StockStatus => {
    const percentage = (stock / maxStock) * 100;
    if (percentage < 30) return { color: 'bg-red-500', status: '库存紧张' };
    if (percentage < 60) return { color: 'bg-yellow-500', status: '库存偏低' };
    return { color: 'bg-green-500', status: '库存充足' };
  }, []);

  return {
    lowStockProducts,
    expiredProducts,
    outOfStockProducts,
    totalStock,
    calculateReplenish,
    isOverCapacity,
    getStockStatus,
  };
}
