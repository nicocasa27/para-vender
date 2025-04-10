
import { Product } from "./inventory";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
}

// Helper function to convert Product to CartItem
export function productToCartItem(product: Product, quantity: number = 1): CartItem {
  return {
    id: product.id,
    nombre: product.nombre,
    precio: product.precio_venta,
    cantidad: quantity,
    stock: product.stock_total || 0
  };
}
