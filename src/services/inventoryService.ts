
import { supabase } from "@/integrations/supabase/client";
import { Product, Category, Store } from "@/types/inventory";
import { toast } from "sonner";

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
  console.log("Adding product:", productData);
  
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

  if (productError) {
    console.error("Error creating product:", productError);
    throw productError;
  }

  if (productData.initialStock > 0 && productData.warehouse) {
    const { error: inventoryError } = await supabase
      .from('inventario')
      .insert([{
        producto_id: newProduct.id,
        almacen_id: productData.warehouse,
        cantidad: productData.initialStock
      }]);

    if (inventoryError) {
      console.error("Error creating inventory:", inventoryError);
      throw inventoryError;
    }

    const { error: movementError } = await supabase
      .from('movimientos')
      .insert([{
        tipo: 'entrada',
        producto_id: newProduct.id,
        almacen_destino_id: productData.warehouse,
        cantidad: productData.initialStock,
        notas: 'Stock inicial'
      }]);
      
    if (movementError) {
      console.error("Error creating movement:", movementError);
      throw movementError;
    }
  }

  return newProduct;
}

export async function updateProduct(productData: any) {
  console.log("🚀 updateProduct: Iniciando actualización con datos:", productData);
  toast.info("Actualizando producto en base de datos...");
  
  try {
    // Verificar que existe el ID del producto
    if (!productData.id) {
      const errorMsg = "ID de producto es requerido para actualizar";
      console.error("❌ updateProduct: Error -", errorMsg);
      toast.error("Error de actualización", { description: errorMsg });
      throw new Error(errorMsg);
    }
    
    const productId = productData.id;
    
    // Primero verificar si el producto existe
    console.log("🔍 updateProduct: Verificando existencia del producto:", productId);
    
    const { data: existingProduct, error: checkError } = await supabase
      .from('productos')
      .select('id')
      .eq('id', productId)
      .single();
    
    if (checkError) {
      console.error("❌ updateProduct: Error al verificar existencia:", checkError);
      
      if (checkError.code === 'PGRST116') {
        const errorMsg = `No se encontró ningún producto con el ID: ${productId}`;
        toast.error("Error de actualización", { description: errorMsg });
        throw new Error(errorMsg);
      }
      
      toast.error("Error de base de datos", { description: checkError.message });
      throw checkError;
    }
    
    if (!existingProduct) {
      const errorMsg = `No se encontró ningún producto con el ID: ${productId}`;
      toast.error("Error de actualización", { description: errorMsg });
      throw new Error(errorMsg);
    }
    
    console.log("✅ updateProduct: Producto encontrado:", existingProduct);
    
    // Crear objeto de actualización con los datos
    // Aceptamos ambos formatos: el de ProductModal y el de ProductForm
    const updateData = {
      nombre: productData.nombre || productData.name,
      precio_compra: productData.precio_compra || productData.purchasePrice || 0,
      precio_venta: productData.precio_venta || productData.salePrice || 0,
      categoria_id: productData.categoria_id || productData.category,
      unidad_id: productData.unidad_id || productData.unit,
      stock_minimo: productData.stock_minimo || productData.minStock || 0,
      stock_maximo: productData.stock_maximo || productData.maxStock || 0
    };
    
    console.log("🔄 updateProduct: Datos preparados para actualización:", updateData);
    
    // Ejecutar la actualización
    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', productId)
      .select();

    if (error) {
      console.error("❌ updateProduct: Error en Supabase:", error);
      toast.error("Error al actualizar en la base de datos", { description: error.message });
      throw error;
    }
    
    if (!data || data.length === 0) {
      const errorMsg = "La actualización no modificó ningún registro";
      toast.error("Error de actualización", { description: errorMsg });
      throw new Error(errorMsg);
    }
    
    console.log("✅ updateProduct: Producto actualizado correctamente:", data);
    toast.success("✅ Producto actualizado correctamente");
    return { success: true, data };
  } catch (error) {
    console.error("❌ updateProduct: Excepción durante actualización:", error);
    toast.error("Error al actualizar", { 
      description: error instanceof Error ? error.message : "Error desconocido" 
    });
    // Propagamos el error para que se maneje en capas superiores
    throw error; 
  }
}

export async function deleteProduct(productId: string) {
  try {
    console.log("Deleting inventory for product:", productId);
    const { error: inventoryError } = await supabase
      .from('inventario')
      .delete()
      .eq('producto_id', productId);

    if (inventoryError) {
      console.error("Error deleting inventory:", inventoryError);
      throw inventoryError;
    }

    console.log("Deleting product:", productId);
    const { error: productError } = await supabase
      .from('productos')
      .delete()
      .eq('id', productId);

    if (productError) {
      console.error("Error deleting product:", productError);
      throw productError;
    }

    return true;
  } catch (error) {
    console.error("Exception deleting product:", error);
    throw error;
  }
}
