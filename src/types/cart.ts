
import { Product } from './inventory';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
  stock_minimo?: number;
  stock_maximo?: number;
  categoria?: string;
  unidad?: string;
  categoria_id?: string;
  unidad_id?: string;
}

export function productToCartItem(product: Product): CartItem {
  return {
    id: product.id,
    nombre: product.nombre,
    precio: product.precio_venta,
    cantidad: 1,
    stock: product.stock_total,
    stock_minimo: product.stock_minimo,
    stock_maximo: product.stock_maximo,
    categoria: product.categoria,
    unidad: product.unidad,
    categoria_id: product.categoria_id,
    unidad_id: product.unidad_id
  };
}
