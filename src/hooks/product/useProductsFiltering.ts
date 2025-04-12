
import { useMemo } from "react";
import { Product } from "@/types/inventory";

interface FilteringOptions {
  products: Product[];
  searchTerm: string;
  categoryFilter: string | null;
  storeFilter: string | null;
  getUserStoreIds: string[] | null;
}

export function useProductsFiltering({
  products,
  searchTerm,
  categoryFilter,
  storeFilter,
  getUserStoreIds
}: FilteringOptions) {
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    
    return products.filter((product) => {
      // Filtrar por sucursales del usuario con rol de ventas
      if (getUserStoreIds && getUserStoreIds.length > 0) {
        if (!product.stock_by_store || Object.keys(product.stock_by_store).length === 0) {
          return false;
        }
        
        const hasStockInUserStore = getUserStoreIds.some(storeId => 
          product.stock_by_store && 
          product.stock_by_store[storeId] !== undefined
        );
        
        if (!hasStockInUserStore) {
          return false;
        }
      }
      
      // Aplicar filtro de búsqueda
      const matchesSearch = searchTerm 
        ? product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      // Aplicar filtro de categoría
      const matchesCategory = categoryFilter 
        ? product.categoria_id === categoryFilter
        : true;
      
      // Aplicar filtro de sucursal
      const matchesStore = storeFilter
        ? (product.stock_by_store && 
           product.stock_by_store[storeFilter] !== undefined && 
           product.stock_by_store[storeFilter] > 0)
        : true;
      
      return matchesSearch && matchesCategory && matchesStore;
    });
  }, [products, searchTerm, categoryFilter, storeFilter, getUserStoreIds]);

  return { filteredProducts };
}
