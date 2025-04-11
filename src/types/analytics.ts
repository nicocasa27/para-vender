
// Create a types file for analytics components
export interface ChartProps {
  data: any[];
  loading?: boolean;
}

export interface SalesDataPoint {
  fecha: string;
  total: number;
}

export interface CategoryDataPoint {
  categoria: string;
  total: number;
}

export interface ProductDataPoint {
  producto: string;
  total: number;
}

// Tipo para la tendencia de ventas por ítem por tienda
export interface ItemSalesTrendDataPoint {
  fecha: string;
  producto: string;
  almacen: string;
  almacen_id: string;
  cantidad: number;
}

// Tipo para ventas mensuales por sucursal
export interface StoreMonthlySalesDataPoint {
  month: string;
  [storeId: string]: string | number;
}

// Tipo para ventas totales por sucursal
export interface TotalSalesByStoreDataPoint {
  id: string;
  nombre: string;
  total: number;
}

// Tipo para productos sin ventas
export interface NonSellingProductDataPoint {
  id: string;
  nombre: string;
  dias_sin_venta: number;
  ultima_venta: string | null;
}
