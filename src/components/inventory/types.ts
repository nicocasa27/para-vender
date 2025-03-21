

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

// Tipo correcto para función RPC sin retorno
// No necesitamos genéricos para este caso
export type UpdateInventoryReturn = void;

