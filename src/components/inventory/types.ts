
export interface Store {
  id: string;
  nombre: string;
}

export interface Product {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
}

export interface TransferHistory {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  producto: string;
  cantidad: number;
  notas: string | null;
}

// Update the parameter type to use string IDs instead of assuming any specific type
export interface UpdateInventoryParams {
  p_producto_id: string;
  p_almacen_id: string;
  p_cantidad: number;
}

// The update_inventory function in SQL returns void
export type UpdateInventoryReturn = void;
