
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Añade un nuevo producto a la base de datos
 * @param productData Datos del producto a agregar
 */
export async function addProduct(productData: any) {
  console.log("Adding product to Supabase:", productData);

  // 1. Insertar producto en tabla productos
  try {
    const { data: newProduct, error: productError } = await supabase
      .from('productos')
      .insert({
        nombre: productData.nombre,
        descripcion: productData.descripcion || null,
        categoria_id: productData.categoria_id,
        unidad_id: productData.unidad_id,
        precio_compra: productData.precio_compra || 0,
        precio_venta: productData.precio_venta,
        stock_minimo: productData.stock_minimo || 0,
        stock_maximo: productData.stock_maximo || 0,
        sucursal_id: productData.sucursal_id || null,
        color: productData.color || null,
        talla: productData.talla || null
      })
      .select()
      .single();
      
    if (productError) {
      console.error("Error adding product:", productError);
      throw new Error(`Error al crear producto: ${productError.message}`);
    }
    
    console.log("Product added successfully:", newProduct);
    
    // 2. Si se proporcionó inventario inicial, añadirlo
    if (productData.initialStock > 0 && newProduct) {
      // Usar sucursal_id como almacén para inventario inicial
      const almacenId = productData.sucursal_id;
      
      if (!almacenId) {
        console.warn("No se especificó ubicación para el inventario inicial");
        return { success: true, data: newProduct };
      }
      
      const { error: inventoryError } = await supabase
        .from('inventario')
        .insert({
          producto_id: newProduct.id,
          almacen_id: almacenId,
          cantidad: productData.initialStock
        });
        
      if (inventoryError) {
        console.error("Error adding initial inventory:", inventoryError);
        toast.error("Producto creado pero hubo un error al añadir inventario inicial");
      }
    }
    
    return { success: true, data: newProduct };
  } catch (error) {
    console.error("Error in addProduct:", error);
    throw error;
  }
}

/**
 * Actualiza un producto existente
 * @param productData Datos actualizados del producto
 */
export async function updateProduct(productData: any) {
  console.log("Updating product in Supabase:", productData);
  
  if (!productData.id) {
    throw new Error("ID de producto es requerido para actualizar");
  }
  
  try {
    const { data: updatedProduct, error: updateError } = await supabase
      .from('productos')
      .update({
        nombre: productData.nombre,
        descripcion: productData.descripcion,
        categoria_id: productData.categoria_id,
        unidad_id: productData.unidad_id,
        precio_compra: productData.precio_compra || 0,
        precio_venta: productData.precio_venta,
        stock_minimo: productData.stock_minimo || 0,
        stock_maximo: productData.stock_maximo || 0,
        sucursal_id: productData.sucursal_id || null,
        color: productData.color || null,
        talla: productData.talla || null
      })
      .eq('id', productData.id)
      .select()
      .single();
      
    if (updateError) {
      console.error("Error updating product:", updateError);
      throw new Error(`Error al actualizar producto: ${updateError.message}`);
    }
    
    console.log("Product updated successfully:", updatedProduct);
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    throw error;
  }
}

/**
 * Elimina un producto por su ID
 * @param productId ID del producto a eliminar
 */
export async function deleteProduct(productId: string) {
  console.log("Deleting product from Supabase:", productId);
  
  // Primero eliminar registros de inventario relacionados
  try {
    const { error: inventoryError } = await supabase
      .from('inventario')
      .delete()
      .eq('producto_id', productId);
      
    if (inventoryError) {
      console.error("Error deleting inventory records:", inventoryError);
      // Continuar intentando eliminar el producto a pesar del error
    }
    
    // Ahora eliminar el producto
    const { error: productError } = await supabase
      .from('productos')
      .delete()
      .eq('id', productId);
      
    if (productError) {
      console.error("Error deleting product:", productError);
      throw new Error(`Error al eliminar producto: ${productError.message}`);
    }
    
    console.log("Product deleted successfully");
    return true;
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    throw error;
  }
}
