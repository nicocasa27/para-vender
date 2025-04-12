
export interface SaleDetail {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Sale {
  id?: string;
  almacen_id: string;
  metodo_pago: string;
  cliente?: string | null;
  total: number;
  detalles: SaleDetail[];
}
