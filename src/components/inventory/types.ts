
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

export interface UpdateInventoryParams {
  p_producto_id: string;
  p_almacen_id: string;
  p_cantidad: number;
}

// Since the update_inventory SQL function returns void, we'll use void as the return type
export type UpdateInventoryReturn = void;
