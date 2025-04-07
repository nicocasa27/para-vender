
import { supabase } from "@/integrations/supabase/client";
import { Product, Category, Store } from "@/types/inventory";

export async function fetchProducts() {
  console.log("Fetching products from Supabase...");
  
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
      categorias (id, nombre),
      unidad_id,
      unidades (nombre)
    `);

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw productsError;
  }
  
  console.log("Products fetched:", productsData?.length || 0);
  console.log("Sample product categoria data:", 
    productsData && productsData.length > 0 
      ? JSON.stringify({
          categoria_id: productsData[0].categoria_id,
          categorias: productsData[0].categorias
        }) 
      : "No products found");

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
  
  return { productsData, inventoryData };
}

export async function fetchCategories() {
  console.log("Fetching categories from Supabase...");
  
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre');
  
  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
  
  console.log("Categories fetched:", data?.length || 0);
  if (data && data.length > 0) {
    console.log("Sample categories:", data.slice(0, 3).map(c => `${c.id}: ${c.nombre}`));
  }
  
  return data;
}

export async function fetchStores() {
  const { data, error } = await supabase
    .from('almacenes')
    .select('id, nombre');
  
  if (error) throw error;
  
  return data;
}

export async function addProduct(productData: any) {
  const { data: newProduct, error: productError } = await supabase
    .from('productos')
    .insert([{
      nombre: productData.name,
      precio_compra: productData.purchasePrice || 0,
      precio_venta: productData.salePrice || 0,
      categoria_id: productData.category,
      unidad_id: productData.unit,
      stock_minimo: productData.minStock || 0,
      stock_maximo: productData.maxStock || 0
    }])
    .select('id')
    .single();

  if (productError) throw productError;

  if (productData.initialStock > 0 && productData.warehouse) {
    const { error: inventoryError } = await supabase
      .from('inventario')
      .insert([{
        producto_id: newProduct.id,
        almacen_id: productData.warehouse,
        cantidad: productData.initialStock
      }]);

    if (inventoryError) throw inventoryError;

    const { error: movementError } = await supabase
      .from('movimientos')
      .insert([{
        tipo: 'entrada',
        producto_id: newProduct.id,
        almacen_destino_id: productData.warehouse,
        cantidad: productData.initialStock,
        notas: 'Stock inicial'
      }]);
      
    if (movementError) throw movementError;
  }

  return newProduct;
}

export async function updateProduct(productId: string, productData: any) {
  console.log("Updating product with ID:", productId);
  console.log("Product data to update:", productData);
  
  try {
    // Crear objeto de actualización con los datos
    const updateData = {
      nombre: productData.name,
      precio_compra: productData.purchasePrice || 0,
      precio_venta: productData.salePrice || 0,
      categoria_id: productData.category,
      unidad_id: productData.unit,
      stock_minimo: productData.minStock || 0,
      stock_maximo: productData.maxStock || 0
    };
    
    console.log("Update data:", updateData);
    
    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', productId)
      .select();

    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }
    
    console.log("Product updated successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Exception updating product:", error);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  const { error: inventoryError } = await supabase
    .from('inventario')
    .delete()
    .eq('producto_id', productId);

  if (inventoryError) throw inventoryError;

  const { error: productError } = await supabase
    .from('productos')
    .delete()
    .eq('id', productId);

  if (productError) throw productError;
}
