import { useMemo } from 'react';
import type { Product } from '../types';
import { isExpiringProduct } from '../utils/expiryUtils';

export function useProductFilter(
  products: Product[],
  selectedCategory: string,
  searchTerm: string
) {
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedCategory === 'all') return matchesSearch;
      if (selectedCategory === 'expiring')
        return matchesSearch && (isExpiringProduct(product) || product.category === 'expiring');
      if (selectedCategory === 'out_of_stock')
        return matchesSearch && !!product.outOfStockRegistered;
      return matchesSearch && product.category === selectedCategory;
    });
  }, [products, selectedCategory, searchTerm]);

  return { filteredProducts };
}
