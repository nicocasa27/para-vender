
export interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  precio_compra: number;
  stock_total: number;
  stock_minimo: number;
  stock_maximo: number;
  categoria: string;
  categoria_id?: string;
  unidad: string;
  unidad_id?: string;
  descripcion?: string;
  sucursal_id?: string;  // Add the store ID field
  sucursal_nombre?: string; // Add the store name field
  color?: string;  // Nuevo campo de color
  talla?: string;  // Nuevo campo de talla
  inventario: {
    almacen_id: string;
    cantidad: number;
  }[];
  stock_by_store?: { [key: string]: number };
  store_names?: { [key: string]: string };
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

export interface Unit {
  id: string;
  nombre: string;
  abreviatura: string;
}

export interface Inventory {
  id: string;
  producto_id: string;
  almacen_id: string;
  cantidad: number;
}

export interface ProductMovement {
  id: string;
  tipo: 'entrada' | 'salida' | 'transferencia';
  cantidad: number;
  producto_id: string;
  almacen_origen_id?: string;
  almacen_destino_id?: string;
  notas?: string;
  created_at: string;
  producto?: {
    nombre: string;
  };
  almacen_origen?: {
    nombre: string;
  };
  almacen_destino?: {
    nombre: string;
  };
}
