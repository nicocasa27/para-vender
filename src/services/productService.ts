
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Obtiene los productos básicos y datos de inventario
 */
export async function fetchProductData() {
  console.log("Fetching products from Supabase...");
  
  // Consultar productos sin relaciones anidadas
  const { data: productsData, error: productsError } = await supabase
    .from('productos')
    .select(`
      id, 
      nombre, 
      precio_venta,
      precio_compra,
      stock_minimo,
      stock_maximo,
      categoria_id,
      unidad_id,
      sucursal_id
    `);

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw productsError;
  }
  
  // Obtener categorías por separado
  const { data: categoriasData, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nombre');
    
  if (categoriasError) {
    console.error("Error fetching categories:", categoriasError);
    // No lanzamos error aquí para permitir que continúe el flujo
  }
  
  // Obtener unidades por separado
  const { data: unidadesData, error: unidadesError } = await supabase
    .from('unidades')
    .select('id, nombre');
    
  if (unidadesError) {
    console.error("Error fetching units:", unidadesError);
    // No lanzamos error aquí para permitir que continúe el flujo
  }
  
  // Obtener almacenes por separado
  const { data: almacenesData, error: almacenesError } = await supabase
    .from('almacenes')
    .select('id, nombre');
    
  if (almacenesError) {
    console.error("Error fetching stores:", almacenesError);
    // No lanzamos error aquí para permitir que continúe el flujo
  }
  
  // Crear mapas para búsqueda rápida
  const categoriasMap = new Map();
  const unidadesMap = new Map();
  const almacenesMap = new Map();
  
  if (categoriasData) {
    categoriasData.forEach(cat => categoriasMap.set(cat.id, cat));
  }
  
  if (unidadesData) {
    unidadesData.forEach(unit => unidadesMap.set(unit.id, unit));
  }

  if (almacenesData) {
    almacenesData.forEach(store => almacenesMap.set(store.id, store));
  }
  
  // Enriquecer los datos de productos
  const enrichedProductsData = productsData?.map(product => {
    const categoria = categoriasMap.get(product.categoria_id);
    const unidad = unidadesMap.get(product.unidad_id);
    const almacen = product.sucursal_id ? almacenesMap.get(product.sucursal_id) : null;
    
    return {
      ...product,
      categorias: categoria ? { nombre: categoria.nombre } : { nombre: "Sin categoría" },
      unidades: unidad ? { nombre: unidad.nombre } : { nombre: "u" },
      almacenes: almacen ? { nombre: almacen.nombre } : { nombre: "Sin sucursal" }
    };
  });
  
  console.log("Products fetched:", enrichedProductsData?.length || 0);

  const { data: inventoryData, error: inventoryError } = await supabase
    .from('inventario')
    .select(`
      producto_id, 
      cantidad, 
      almacen_id, 
      almacenes(nombre)
    `);
    
  if (inventoryError) {
    console.error("Error fetching inventory:", inventoryError);
    throw inventoryError;
  }
  
  console.log("Inventory items fetched:", inventoryData?.length || 0);
  
  return { productsData: enrichedProductsData, inventoryData };
}
