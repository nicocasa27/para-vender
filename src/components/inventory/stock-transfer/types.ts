
export interface StoreData {
  id: string;
  nombre: string;
}

export interface ProductStock {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
}

export interface TransferRecord {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  producto: string;
  cantidad: number;
  notas: string | null;
}

export interface StockTransferFormData {
  sourceStoreId: string;
  targetStoreId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface StockTransferFormProps {
  onTransferComplete: () => void;
  onTransferSuccess?: () => void; // Adding backward compatibility
}
