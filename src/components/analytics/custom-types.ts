
// Define custom types for our analytics components to work around Supabase type issues

export interface Store {
  id: string;
  nombre: string;
}

export interface Category {
  id: string;
  nombre: string;
}

export interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  precio_compra?: number;
  categoria_id?: string;
}

export interface SaleDetail {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  venta_id: string;
  ventas?: {
    almacen_id: string;
    created_at: string;
  };
}

export interface Sale {
  id: string;
  total: number;
  created_at: string;
  almacen_id?: string;
  estado?: string;
}

export interface InventoryItem {
  id: string;
  producto_id: string;
  almacen_id: string;
  cantidad: number;
}

export interface AverageTicketDataPoint {
  date: string;
  average: number;
}

export interface MarginData {
  name: string;
  sales: number;
  cost: number;
  margin: number;
}

export interface ProductSalesChange {
  name: string;
  current: number;
  previous: number;
  change: number;
}
