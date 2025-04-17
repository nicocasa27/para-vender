
import { Product } from "@/types/inventory";

/**
 * Transforma los datos de productos y de inventario en un objeto combinado
 * @param productsData Datos de productos desde Supabase
 * @param inventoryData Datos de inventario desde Supabase
 */
export function mapInventoryData(productsData: any[], inventoryData: any[]): Product[] {
  // Crear un mapa de almacenes por nombre para mostrar nombres más amigables
  const storeNamesMap = new Map();
  
  // Agrupar el inventario por producto
  const inventoryByProduct = inventoryData.reduce((map, item) => {
    const productId = item.producto_id;
    if (!map.has(productId)) {
      map.set(productId, []);
    }
    
    // Guardar el nombre del almacén si está disponible
    if (item.almacenes && item.almacenes.nombre) {
      storeNamesMap.set(item.almacen_id, item.almacenes.nombre);
    }
    
    map.get(productId).push({
      almacen_id: item.almacen_id,
      cantidad: Number(item.cantidad) || 0
    });
    
    return map;
  }, new Map());
  
  // Transformar datos de productos
  return productsData.map(product => {
    // Obtener inventario para este producto
    const inventoryItems = inventoryByProduct.get(product.id) || [];
    
    // Calcular stock total sumando todos los inventarios
    const stockTotal = inventoryItems.reduce((sum, item) => sum + item.cantidad, 0);
    
    // Crear un mapa de stock por almacén
    const stockByStore = inventoryItems.reduce((map, item) => {
      map[item.almacen_id] = item.cantidad;
      return map;
    }, {} as Record<string, number>);
    
    // Crear un mapa de nombres de almacenes
    const storeNames = inventoryItems.reduce((map, item) => {
      map[item.almacen_id] = storeNamesMap.get(item.almacen_id) || `Almacén ${item.almacen_id}`;
      return map;
    }, {} as Record<string, string>);

    // Get the store name if sucursal_id is available
    let sucursalNombre = '';
    if (product.sucursal_id && storeNamesMap.has(product.sucursal_id)) {
      sucursalNombre = storeNamesMap.get(product.sucursal_id);
    }
    
    // Crear objeto Product y asegurarse de que color y talla sean strings, no null
    return {
      id: product.id,
      nombre: product.nombre,
      precio_venta: Number(product.precio_venta) || 0,
      precio_compra: Number(product.precio_compra) || 0,
      categoria: product.categorias?.nombre || 'Sin categoría',
      categoria_id: product.categoria_id,
      unidad: product.unidades?.nombre || 'u',
      unidad_id: product.unidad_id,
      stock_total: stockTotal,
      stock_minimo: Number(product.stock_minimo) || 0,
      stock_maximo: Number(product.stock_maximo) || 0,
      descripcion: product.descripcion || '',
      sucursal_id: product.sucursal_id || null,
      sucursal_nombre: sucursalNombre || 'Sin sucursal',
      inventario: inventoryItems,
      stock_by_store: stockByStore,
      store_names: storeNames,
      color: product.color || '',
      talla: product.talla || ''
    };
  });
}
