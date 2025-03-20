
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

// After examining the update_inventory SQL function, it returns void
// We'll use a more appropriate type that works with Supabase's generics
export type UpdateInventoryReturn = Record<string, never>;
