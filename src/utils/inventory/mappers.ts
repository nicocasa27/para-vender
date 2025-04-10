
import { Product } from "@/types/inventory";

/**
 * Mapea los datos de inventario a la estructura de producto esperada por la UI
 */
export function mapInventoryData(products: any[], inventoryData: any[]): Product[] {
  return products.map(product => {
    const inventoryItems = inventoryData?.filter(
      item => item.producto_id === product.id
    ) || [];

    const stockByStore: {[key: string]: number} = {};
    const storeNames: {[key: string]: string} = {};

    let stockTotal = 0;
    
    inventoryItems.forEach(item => {
      const cantidad = Number(item.cantidad);
      const almacenId = item.almacen_id;
      stockByStore[almacenId] = cantidad;
      stockTotal += cantidad;
      
      if (item.almacenes) {
        storeNames[almacenId] = item.almacenes.nombre || '';
      }
    });

    // Extraemos los valores de los objetos "categorias" y "unidades" 
    const catName = product.categorias ? product.categorias.nombre || "Sin categoría" : "Sin categoría";
    const unitAbbr = product.unidades ? product.unidades.nombre || "u" : "u";

    return {
      id: product.id || '',
      nombre: product.nombre || '',
      precio_venta: Number(product.precio_venta) || 0,
      precio_compra: Number(product.precio_compra || 0),
      stock_total: stockTotal,
      categoria: catName,
      categoria_id: product.categoria_id,
      unidad: unitAbbr,
      unidad_id: product.unidad_id,
      stock_minimo: Number(product.stock_minimo || 0),
      stock_maximo: Number(product.stock_maximo || 0),
      stock_by_store: stockByStore,
      store_names: storeNames
    } as Product;
  });
}
