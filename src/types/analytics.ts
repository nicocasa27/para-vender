
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
