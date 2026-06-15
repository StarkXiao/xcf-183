import { useState } from 'react';
import type { Product } from '../types';

export function useProductDomain(initialProducts: Product[]) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  return {
    products,
    setProducts,
    selectedProduct,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
  };
}
