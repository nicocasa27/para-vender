
export interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_total: number;
  almacen_id: string;
  categoria?: string;
  unidad?: string;
  categoria_id?: string;
  unidad_id?: string;
}

export interface Category {
  id: string;
  nombre: string;
}

export interface Store {
  id: string;
  nombre: string;
  direccion?: string;
}
