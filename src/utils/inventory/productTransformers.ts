
/**
 * Utilidad para transformar datos del formulario de productos al formato esperado por Supabase
 */

// Definimos la interfaz para los datos que vienen del formulario
interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  maxStock: number;
  location: string;
  color?: string;
  talla?: string;
  stockAdjustment?: number;
  initialStock?: number;
}

/**
 * Transforma los datos del formulario al formato esperado por el servicio
 */
export function transformProductFormData(data: ProductFormData, isEditing: boolean, productId: string | null = null, currentStock: number = 0) {
  // Validar que location sea una ubicación válida (no puede ser "no-location" para ajustes de stock)
  if (isEditing && data.stockAdjustment !== 0 && data.stockAdjustment !== undefined && data.location === "no-location") {
    throw new Error("Para ajustar el inventario, debes seleccionar una ubicación válida");
  }

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
  // Aseguramos que llegue como número con valor distinto de cero
  if (isEditing && typeof data.stockAdjustment === 'number' && data.stockAdjustment !== 0) {
    productData.stockAdjustment = data.stockAdjustment;
    
    // Asegurarse de que sucursal_id esté presente para ajustes de inventario
    if (!productData.sucursal_id) {
      throw new Error("Para ajustar el inventario, se requiere una ubicación válida");
    }
    
    // Añadir log para debug
    console.log(`Ajuste de stock: ${data.stockAdjustment}, Stock actual: ${currentStock}, Nuevo stock esperado: ${currentStock + data.stockAdjustment}, Ubicación: ${productData.sucursal_id}`);
  } else if (isEditing) {
    console.log("No se detectó ajuste de stock o es cero");
  }
  
  if (!isEditing && data.location && data.location !== "no-location" && data.initialStock && data.initialStock > 0) {
    productData.initialStock = data.initialStock;
  }
  
  return productData;
}
