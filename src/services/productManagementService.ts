
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Añade un nuevo producto a la base de datos
 */
export async function addProduct(productData: any) {
  console.log("Adding product to Supabase:", productData);

  try {
    // 1. Insertar producto en tabla productos
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
    
    // 2. Manejar inventario inicial si está presente
    await handleInitialInventory(productData, newProduct);
    
    return { success: true, data: newProduct };
  } catch (error) {
    console.error("Error in addProduct:", error);
    throw error;
  }
}

/**
 * Gestiona el inventario inicial de un producto nuevo
 */
async function handleInitialInventory(productData: any, newProduct: any) {
  if (!(productData.initialStock > 0 && newProduct)) {
    console.log("No se agregó inventario inicial (cantidad = 0 o falta el producto)");
    return;
  }
    
  // Usar sucursal_id como almacén para inventario inicial
  const almacenId = productData.sucursal_id;
  
  if (!almacenId) {
    console.warn("No se especificó ubicación para el inventario inicial");
    return;
  }
  
  console.log(`Agregando inventario inicial: ${productData.initialStock} unidades en almacén ${almacenId}`);
  
  try {
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventario')
      .insert({
        producto_id: newProduct.id,
        almacen_id: almacenId,
        cantidad: productData.initialStock
      })
      .select();
      
    if (inventoryError) {
      console.error("Error adding initial inventory:", inventoryError);
      toast.error("Producto creado pero hubo un error al añadir inventario inicial");
      return;
    }
    
    console.log("Inventario inicial agregado correctamente:", inventoryData);
  } catch (error) {
    console.error("Error al manejar inventario inicial:", error);
    toast.error("Error al manejar inventario inicial");
  }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(productData: any) {
  console.log("Updating product in Supabase:", productData);
  
  if (!productData.id) {
    throw new Error("ID de producto es requerido para actualizar");
  }
  
  try {
    // Actualizar datos básicos del producto
    const updateData = {
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
    };
    
    const { data: updatedProduct, error: updateError } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', productData.id)
      .select()
      .single();
      
    if (updateError) {
      console.error("Error updating product:", updateError);
      throw new Error(`Error al actualizar producto: ${updateError.message}`);
    }
    
    console.log("Product updated successfully:", updatedProduct);
    
    // Manejar ajuste de inventario si es necesario
    if (productData.stockAdjustment && productData.stockAdjustment !== 0) {
      console.log(`Ajuste de inventario solicitado: ${productData.stockAdjustment}`);
      await handleInventoryAdjustment(productData);
    } else {
      console.log("No se realizó ajuste de inventario (ajuste = 0 o no especificado)");
    }
    
    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    throw error;
  }
}

/**
 * Gestiona ajustes de inventario durante la actualización de productos
 */
async function handleInventoryAdjustment(productData: any) {
  if (!(productData.stockAdjustment && productData.stockAdjustment !== 0)) {
    console.log("No hay ajuste de inventario para realizar");
    return;
  }
  
  // Necesitamos el almacén (sucursal) del producto para actualizar su inventario
  const almacenId = productData.sucursal_id;
  
  if (!almacenId) {
    console.warn("No se encontró el almacén del producto para ajustar el stock");
    toast.error("No se pudo ajustar el inventario: Falta la ubicación del producto");
    return;
  }
  
  console.log(`Ajustando inventario: ${productData.stockAdjustment} unidades en almacén ${almacenId}`);
  
  try {
    // Actualizar inventario usando RPC
    const { data: adjustmentResult, error: adjustmentError } = await supabase
      .rpc('update_inventory', {
        p_producto_id: productData.id,
        p_almacen_id: almacenId,
        p_cantidad: productData.stockAdjustment
      });
      
    if (adjustmentError) {
      console.error("Error adjusting inventory:", adjustmentError);
      toast.error("Producto actualizado pero hubo un error al ajustar el inventario", {
        description: adjustmentError.message
      });
      return;
    }
    
    console.log("Inventario ajustado correctamente", adjustmentResult);
    
    // Registrar el movimiento
    await logInventoryMovement(productData, almacenId);
    toast.success("Inventario actualizado correctamente");
  } catch (error) {
    console.error("Error al realizar ajuste de inventario:", error);
    toast.error("Error al ajustar inventario");
  }
}

/**
 * Registra un movimiento de inventario en la tabla de movimientos
 */
async function logInventoryMovement(productData: any, almacenId: string) {
  const movimientoTipo = productData.stockAdjustment > 0 ? 'entrada' : 'salida';
  const cantidadAbs = Math.abs(productData.stockAdjustment);
  
  try {
    const { data: movimientoData, error: movimientoError } = await supabase
      .from('movimientos')
      .insert({
        producto_id: productData.id,
        almacen_origen_id: movimientoTipo === 'salida' ? almacenId : null,
        almacen_destino_id: movimientoTipo === 'entrada' ? almacenId : null,
        cantidad: cantidadAbs,
        tipo: movimientoTipo,
        notas: `Ajuste manual desde edición de producto`
      })
      .select();
      
    if (movimientoError) {
      console.error("Error registering movement:", movimientoError);
      toast.error("Inventario ajustado pero no se pudo registrar el movimiento");
    } else {
      console.log("Movimiento registrado correctamente:", movimientoData);
    }
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
  }
}

/**
 * Elimina un producto por su ID
 */
export async function deleteProduct(productId: string) {
  console.log("Deleting product from Supabase:", productId);
  
  try {
    // Primero eliminar registros de inventario relacionados
    const { error: inventoryError } = await supabase
      .from('inventario')
      .delete()
      .eq('producto_id', productId);
      
    if (inventoryError) {
      console.error("Error deleting inventory records:", inventoryError);
      // Continuar eliminando producto a pesar del error
    }
    
    // Eliminar producto
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
