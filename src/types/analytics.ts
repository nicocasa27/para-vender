
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

export interface StoreDataPoint {
  store_id: string;
  store_name: string;
  total: number;
}

export interface SaleTrendDataPoint {
  date: string;
  [key: string]: any; // For dynamic product names as keys
}

export interface HourlyDataPoint {
  hour: string;
  sales: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  status: 'warning' | 'critical';
}

export interface AverageTicketDataPoint {
  date: string;
  [storeId: string]: number | string;
}

export interface MarginDataPoint {
  category: string;
  sales: number;
  costs: number;
  margin: number;
}
