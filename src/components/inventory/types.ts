
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

// El tipo de retorno para la función RPC update_inventory
// Usamos Record<string, never> que es compatible con los tipos de Supabase
export type UpdateInventoryReturn = Record<string, never>;
