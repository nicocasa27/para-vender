
export interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_total: number;
  almacen_id?: string;
  categoria?: string;
  unidad?: string;
  categoria_id?: string;
  unidad_id?: string;
  precio_compra?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  stock_by_store?: {[key: string]: number};
  store_names?: {[key: string]: string};
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

export interface StockTransfer {
  id: string;
  producto_id: string;
  producto: {
    nombre: string;
  };
  almacen_origen_id: string;
  almacen_origen: {
    nombre: string;
  };
  almacen_destino_id: string;
  almacen_destino: {
    nombre: string;
  };
  cantidad: number;
  fecha: string;
}
