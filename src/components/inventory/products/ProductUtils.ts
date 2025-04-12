
import { Product } from "@/types/inventory";
import { formatQuantityWithUnit } from "@/utils/inventory/formatters";

export const getStockStatusColor = (product: Product) => {
  if (!product.stock_minimo) return "bg-green-100 text-green-800";
  if (product.stock_total <= product.stock_minimo) return "bg-red-100 text-red-800";
  if (product.stock_maximo && product.stock_total >= product.stock_maximo) return "bg-amber-100 text-amber-800";
  return "bg-green-100 text-green-800";
};

export const getDisplayStock = (product: Product, storeFilter?: string) => {
  if (storeFilter && product.stock_by_store && product.stock_by_store[storeFilter] !== undefined) {
    return formatQuantityWithUnit(product.stock_by_store[storeFilter], product.unidad);
  }
  return formatQuantityWithUnit(product.stock_total, product.unidad);
};

export const getProductStoreName = (product: Product) => {
  return product.sucursal_nombre || 'Sin sucursal';
};
