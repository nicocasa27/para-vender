
import { toast } from "sonner";

interface ProductFormData {
  name: any;
  description?: any;
  category: any;
  unit: any;
  purchasePrice: any;
  salePrice: any;
  minStock: any;
  maxStock: any;
  location: any;
  color?: any;
  talla?: any;
  stockAdjustment?: number;
  initialStock?: number;
}

export function transformProductFormData(data: ProductFormData, isEditing: boolean, productId: string | null = null, currentStock: number = 0) {
  const productData: any = {
    id: isEditing && productId ? productId : null,
    nombre: data.name,
    descripcion: data.description || null,
    categoria_id: data.category,
    unidad_id: data.unit,
    precio_compra: data.purchasePrice,
    precio_venta: data.salePrice,
    stock_minimo: data.minStock,
    stock_maximo: data.maxStock,
    sucursal_id: data.location === "no-location" ? null : data.location,
    color: data.color || null,
    talla: data.talla || null
  };
  
  // Si estamos editando y hay un ajuste de stock, incluirlo
  if (isEditing && typeof data.stockAdjustment === 'number' && data.stockAdjustment !== 0) {
    productData.stockAdjustment = data.stockAdjustment;
  }
  
  if (!isEditing && data.location && data.location !== "no-location" && data.initialStock && data.initialStock > 0) {
    productData.initialStock = data.initialStock;
  }
  
  return productData;
}
