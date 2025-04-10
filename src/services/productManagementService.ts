
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Añade un nuevo producto a la base de datos
 */
export async function addProduct(productData: any) {
  console.log("🚀 addProduct: Iniciando creación con datos:", productData);
  
  try {
    // Determinar los nombres de propiedades correctamente
    const nombre = productData.nombre || productData.name || "";
    const categoria_id = productData.categoria_id || productData.category || null;
    const unidad_id = productData.unidad_id || productData.unit || null;
    const precio_compra = Number(productData.precio_compra || productData.purchasePrice || 0);
    const precio_venta = Number(productData.precio_venta || productData.salePrice || 0);
    const stock_minimo = Number(productData.stock_minimo || productData.minStock || 0);
    const stock_maximo = Number(productData.stock_maximo || productData.maxStock || 0);
    
    // Validaciones básicas
    if (!nombre) {
      throw new Error("El nombre del producto es obligatorio");
    }
    
    if (!categoria_id) {
      throw new Error("La categoría del producto es obligatoria");
    }
    
    if (!unidad_id) {
      throw new Error("La unidad de medida del producto es obligatoria");
    }
    
    // Manejar datos de inventario
    let almacen_id, cantidad_inicial;
    
    if (productData.inventario) {
      // Si viene en formato de objeto inventario
      almacen_id = productData.inventario.almacen_id;
      cantidad_inicial = Number(productData.inventario.cantidad || 0);
      console.log("📦 addProduct: Datos de inventario encontrados en formato objeto:", { almacen_id, cantidad_inicial });
    } else {
      // Si viene en formato plano
      almacen_id = productData.warehouse || productData.almacen_id;
      cantidad_inicial = Number(productData.initialStock || 0);
      console.log("📦 addProduct: Datos de inventario encontrados en formato plano:", { almacen_id, cantidad_inicial });
    }
    
    // Crear el producto en la base de datos
    console.log("📝 addProduct: Insertando producto con datos:", {
      nombre, categoria_id, unidad_id, precio_compra, precio_venta, stock_minimo, stock_maximo
    });
    
    const { data: newProduct, error: productError } = await supabase
      .from('productos')
      .insert([{
        nombre,
        precio_compra,
        precio_venta,
        categoria_id,
        unidad_id,
        stock_minimo,
        stock_maximo
      }])
      .select('id, nombre')
      .single();

    if (productError) {
      console.error("❌ addProduct: Error al crear producto:", productError);
      throw productError;
    }
    
    console.log("✅ addProduct: Producto creado correctamente:", newProduct);

    // Si hay stock inicial y almacén, registrar el inventario inicial
    if (cantidad_inicial > 0 && almacen_id) {
      console.log("📦 addProduct: Registrando inventario inicial:", { 
        producto_id: newProduct.id, 
        almacen_id, 
        cantidad: cantidad_inicial 
      });
      
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventario')
        .insert([{
          producto_id: newProduct.id,
          almacen_id,
          cantidad: cantidad_inicial
        }])
        .select();

      if (inventoryError) {
        console.error("❌ addProduct: Error al registrar inventario:", inventoryError);
        // No lanzar error aquí, continuamos para crear el movimiento
        toast.error("Advertencia: No se pudo registrar el inventario inicial");
      } else {
        console.log("✅ addProduct: Inventario inicial registrado:", inventoryData);
      }

      // Registrar el movimiento de entrada inicial
      console.log("📋 addProduct: Registrando movimiento de entrada inicial");
      
      const { data: movementData, error: movementError } = await supabase
        .from('movimientos')
        .insert([{
          tipo: 'entrada',
          producto_id: newProduct.id,
          almacen_destino_id: almacen_id,
          cantidad: cantidad_inicial,
          notas: 'Stock inicial'
        }])
        .select();
        
      if (movementError) {
        console.error("❌ addProduct: Error al registrar movimiento:", movementError);
        // No lanzar error aquí, el producto ya se creó
        toast.error("Advertencia: No se pudo registrar el movimiento inicial");
      } else {
        console.log("✅ addProduct: Movimiento inicial registrado:", movementData);
      }
    } else {
      console.log("ℹ️ addProduct: No se registrará inventario inicial (cantidad=0 o no hay almacén)");
    }

    return { success: true, data: newProduct };
  } catch (error) {
    console.error("❌ addProduct: Error general:", error);
    throw error;
  }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(productData: any) {
  console.log("🚀 updateProduct: Iniciando actualización con datos:", productData);
  
  try {
    // Verificar que existe el ID del producto
    if (!productData.id) {
      const errorMsg = "ID de producto es requerido para actualizar";
      console.error("❌ updateProduct: Error -", errorMsg);
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
        throw new Error(`No se encontró ningún producto con el ID: ${productId}`);
      }
      
      throw checkError;
    }
    
    if (!existingProduct) {
      throw new Error(`No se encontró ningún producto con el ID: ${productId}`);
    }
    
    console.log("✅ updateProduct: Producto encontrado:", existingProduct);
    
    // Crear objeto de actualización con los datos
    // Aceptamos ambos formatos: el de ProductModal y el de ProductForm
    const updateData = {
      nombre: productData.nombre || productData.name,
      precio_compra: Number(productData.precio_compra || productData.purchasePrice || 0),
      precio_venta: Number(productData.precio_venta || productData.salePrice || 0),
      categoria_id: productData.categoria_id || productData.category,
      unidad_id: productData.unidad_id || productData.unit,
      stock_minimo: Number(productData.stock_minimo || productData.minStock || 0),
      stock_maximo: Number(productData.stock_maximo || productData.maxStock || 0)
    };
    
    console.log("🔄 updateProduct: Datos preparados para actualización:", updateData);
    
    // Ejecutar la actualización
    const { data: updatedProduct, error: updateError } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ updateProduct: Error al actualizar producto:", updateError);
      throw updateError;
    }
    
    console.log("✅ updateProduct: Producto actualizado correctamente:", updatedProduct);

    // Manejar la actualización del inventario si se proporciona
    let inventoryUpdated = false;
    
    // Revisar si hay datos de inventario para actualizar
    if (productData.inventario || productData.warehouse || productData.initialStock > 0) {
      // Determinar los datos de inventario
      let almacen_id = null;
      let cantidad_nueva = 0;
      
      if (productData.inventario) {
        almacen_id = productData.inventario.almacen_id;
        cantidad_nueva = Number(productData.inventario.cantidad || 0);
      } else {
        almacen_id = productData.warehouse || productData.almacen_id;
        cantidad_nueva = Number(productData.initialStock || 0);
      }
      
      if (almacen_id && cantidad_nueva > 0) {
        console.log("📦 updateProduct: Verificando inventario existente para producto:", productId);
        
        // Verificar si ya existe un registro de inventario para este producto y almacén
        const { data: existingInventory, error: inventoryCheckError } = await supabase
          .from('inventario')
          .select('*')
          .eq('producto_id', productId)
          .eq('almacen_id', almacen_id)
          .maybeSingle();
        
        if (inventoryCheckError) {
          console.error("❌ updateProduct: Error al verificar inventario:", inventoryCheckError);
          toast.error("Advertencia: Error al verificar inventario existente");
        } else {
          if (existingInventory) {
            // Si ya existe un registro, actualizar la cantidad
            console.log("🔄 updateProduct: Actualizando inventario existente:", existingInventory);
            
            // Sólo actualizar si la cantidad ha cambiado
            if (existingInventory.cantidad !== cantidad_nueva) {
              const { error: inventoryUpdateError } = await supabase
                .from('inventario')
                .update({ cantidad: cantidad_nueva })
                .eq('id', existingInventory.id);
              
              if (inventoryUpdateError) {
                console.error("❌ updateProduct: Error al actualizar inventario:", inventoryUpdateError);
                toast.error("Advertencia: No se pudo actualizar el inventario");
              } else {
                console.log("✅ updateProduct: Inventario actualizado correctamente");
                inventoryUpdated = true;
                
                // Registrar el movimiento si hubo un cambio de cantidad
                const diferencia = cantidad_nueva - existingInventory.cantidad;
                
                if (diferencia !== 0) {
                  const tipo = diferencia > 0 ? 'entrada' : 'salida';
                  const cantidad_abs = Math.abs(diferencia);
                  
                  console.log(`📋 updateProduct: Registrando movimiento de ${tipo}:`, {
                    producto_id: productId,
                    cantidad: cantidad_abs,
                    almacen: almacen_id
                  });
                  
                  const { error: movementError } = await supabase
                    .from('movimientos')
                    .insert([{
                      tipo,
                      producto_id: productId,
                      almacen_origen_id: tipo === 'salida' ? almacen_id : null,
                      almacen_destino_id: tipo === 'entrada' ? almacen_id : null,
                      cantidad: cantidad_abs,
                      notas: 'Actualización de producto'
                    }]);
                    
                  if (movementError) {
                    console.error("❌ updateProduct: Error al registrar movimiento:", movementError);
                    toast.error("Advertencia: No se pudo registrar el movimiento");
                  } else {
                    console.log("✅ updateProduct: Movimiento registrado correctamente");
                  }
                }
              }
            } else {
              console.log("ℹ️ updateProduct: La cantidad no ha cambiado, no se actualiza el inventario");
            }
          } else {
            // Si no existe, crear un nuevo registro de inventario
            console.log("📦 updateProduct: Creando nuevo registro de inventario");
            
            const { error: inventoryInsertError } = await supabase
              .from('inventario')
              .insert([{
                producto_id: productId,
                almacen_id,
                cantidad: cantidad_nueva
              }]);
            
            if (inventoryInsertError) {
              console.error("❌ updateProduct: Error al crear inventario:", inventoryInsertError);
              toast.error("Advertencia: No se pudo crear el registro de inventario");
            } else {
              console.log("✅ updateProduct: Inventario creado correctamente");
              inventoryUpdated = true;
              
              // Registrar el movimiento de entrada
              const { error: movementError } = await supabase
                .from('movimientos')
                .insert([{
                  tipo: 'entrada',
                  producto_id: productId,
                  almacen_destino_id: almacen_id,
                  cantidad: cantidad_nueva,
                  notas: 'Inventario inicial en actualización'
                }]);
                
              if (movementError) {
                console.error("❌ updateProduct: Error al registrar movimiento:", movementError);
                toast.error("Advertencia: No se pudo registrar el movimiento");
              } else {
                console.log("✅ updateProduct: Movimiento registrado correctamente");
              }
            }
          }
        }
      } else {
        console.log("ℹ️ updateProduct: No hay datos suficientes para actualizar inventario");
      }
    }
    
    return { 
      success: true, 
      data: updatedProduct, 
      inventoryUpdated
    };
    
  } catch (error) {
    console.error("❌ updateProduct: Error general:", error);
    throw error;
  }
}

/**
 * Elimina un producto y su inventario asociado
 */
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
