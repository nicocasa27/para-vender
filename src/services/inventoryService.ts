import { supabase } from "@/integrations/supabase/client";
import { Product, Category, Store } from "@/types/inventory";
import { toast } from 'sonner';

export interface InventoryMovement {
  id?: string;
  producto_id: string;
  almacen_id: string;  // Cambiado de sucursal_id a almacen_id
  cantidad: number;
  tipo: 'entrada' | 'salida';
  motivo?: string;
  fecha?: string;
}

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
  
  // Intentar obtener inventario de la tabla sucursales primero
  let inventoryData;
  let inventoryError;
  
  try {
    const result = await supabase
      .from('inventario')
      .select(`
        producto_id, 
        cantidad, 
        sucursal_id, 
        sucursales(nombre)
      `);
      
    inventoryData = result.data;
    inventoryError = result.error;
    
    if (inventoryError) {
      console.log("Error al obtener inventario con sucursales, intentando con almacenes");
      // Si hay un error (probablemente porque sucursal_id no existe), intentamos con almacen_id
      const fallbackResult = await supabase
        .from('inventario')
        .select(`
          producto_id, 
          cantidad, 
          almacen_id, 
          almacenes(nombre)
        `);
        
      inventoryData = fallbackResult.data;
      inventoryError = fallbackResult.error;
    }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    // Intentar con la estructura antigua (almacenes)
    const fallbackResult = await supabase
      .from('inventario')
      .select(`
        producto_id, 
        cantidad, 
        almacen_id, 
        almacenes(nombre)
      `);
      
    inventoryData = fallbackResult.data;
    inventoryError = fallbackResult.error;
  }
    
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
  // Intentar obtener sucursales primero
  try {
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, nombre');
    
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.log("Error al obtener sucursales, intentando con almacenes", e);
  }
  
  // Fallback a almacenes
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
    try {
      // Intentar usar sucursal_id primero
      const { error: inventoryError } = await supabase
        .from('inventario')
        .insert([{
          producto_id: newProduct.id,
          sucursal_id: productData.warehouse,
          cantidad: productData.initialStock
        }]);

      if (inventoryError) {
        // Si hay error, intentar con almacen_id
        console.log("Error al insertar en inventario usando sucursal_id, intentando con almacen_id");
        const { error: fallbackError } = await supabase
          .from('inventario')
          .insert([{
            producto_id: newProduct.id,
            almacen_id: productData.warehouse,
            cantidad: productData.initialStock
          }]);

        if (fallbackError) throw fallbackError;
      }
    } catch (e) {
      console.error("Error al insertar inventario inicial:", e);
      throw e;
    }

    // Registrar el movimiento
    const storeFieldName = await determineStoreFieldName();
    const movementData: any = {
      tipo: 'entrada',
      producto_id: newProduct.id,
      cantidad: productData.initialStock,
      notas: 'Stock inicial'
    };
    
    // Asignar el campo correcto
    if (storeFieldName === 'sucursal_id') {
      movementData.almacen_destino_id = productData.warehouse;
    } else {
      movementData.almacen_destino_id = productData.warehouse;
    }
    
    try {
      const { error: movementError } = await supabase
        .from('movimientos')
        .insert([movementData]);
        
      if (movementError) throw movementError;
    } catch (e) {
      console.error("Error al registrar movimiento:", e);
      // No lanzamos error aquí para que no afecte la creación del producto
    }
  }

  return newProduct;
}

export async function updateProduct(productId: string, productData: any) {
  const { error } = await supabase
    .from('productos')
    .update({
      nombre: productData.name,
      precio_compra: productData.purchasePrice || 0,
      precio_venta: productData.salePrice || 0,
      categoria_id: productData.category,
      unidad_id: productData.unit,
      stock_minimo: productData.minStock || 0,
      stock_maximo: productData.maxStock || 0
    })
    .eq('id', productId);

  if (error) throw error;
}

export async function deleteProduct(productId: string) {
  // Eliminar inventario primero
  const { error: inventoryError } = await supabase
    .from('inventario')
    .delete()
    .eq('producto_id', productId);

  if (inventoryError) throw inventoryError;

  // Luego eliminar el producto
  const { error: productError } = await supabase
    .from('productos')
    .delete()
    .eq('id', productId);

  if (productError) throw productError;
}

// Función auxiliar para determinar qué campo usar en tablas de inventario
async function determineStoreFieldName(): Promise<'sucursal_id' | 'almacen_id'> {
  try {
    // Verificar si la tabla inventario tiene la columna sucursal_id
    const { data } = await supabase
      .from('inventario')
      .select('sucursal_id')
      .limit(1);
    
    if (data) {
      return 'sucursal_id';
    }
  } catch (e) {
    console.log("Error al verificar sucursal_id, usando almacen_id por defecto");
  }
  
  return 'almacen_id';
}

export async function getInventory() {
  try {
    const { data, error } = await supabase
      .from('inventario')
      .select(`
        id,
        cantidad,
        producto_id,
        almacen_id,  // Cambiado de sucursal_id a almacen_id
        productos(id, nombre),
        almacenes(id, nombre)  // Cambiado de sucursales a almacenes
      `);

    if (error) throw error;
    return data;
  } catch (error: any) {
    toast.error('Error al obtener el inventario', {
      description: error.message,
    });
    return [];
  }
}

export async function addInventoryMovement(movement: InventoryMovement) {
  try {
    // 1. Registrar el movimiento
    const { data: movementData, error: movementError } = await supabase
      .from('movimientos')
      .insert({
        producto_id: movement.producto_id,
        almacen_id: movement.almacen_id,  // Cambiado de sucursal_id a almacen_id
        cantidad: movement.cantidad,
        tipo: movement.tipo,
        motivo: movement.motivo || '',
        fecha: movement.fecha || new Date().toISOString()
      })
      .select('id')
      .single();

    if (movementError) throw movementError;

    // 2. Actualizar el inventario
    // Primero verificar si existe un registro para este producto en este almacén
    const { data: existingInventory, error: checkError } = await supabase
      .from('inventario')
      .select('id, cantidad')
      .eq('producto_id', movement.producto_id)
      .eq('almacen_id', movement.almacen_id)  // Cambiado de sucursal_id a almacen_id
      .maybeSingle();

    if (checkError) throw checkError;

    // Calcular la nueva cantidad
    const movementAmount = movement.tipo === 'entrada' ? movement.cantidad : -movement.cantidad;
    
    if (existingInventory) {
      // Actualizar registro existente
      const newQuantity = existingInventory.cantidad + movementAmount;
      
      const { error: updateError } = await supabase
        .from('inventario')
        .update({ cantidad: newQuantity })
        .eq('id', existingInventory.id);
        
      if (updateError) throw updateError;
    } else {
      // Crear nuevo registro de inventario
      const { error: insertError } = await supabase
        .from('inventario')
        .insert({
          producto_id: movement.producto_id,
          almacen_id: movement.almacen_id,  // Cambiado de sucursal_id a almacen_id
          cantidad: movementAmount
        });
        
      if (insertError) throw insertError;
    }

    toast.success(
      movement.tipo === 'entrada' 
        ? 'Entrada de inventario registrada' 
        : 'Salida de inventario registrada'
    );
    
    return true;
  } catch (error: any) {
    toast.error('Error al registrar movimiento', {
      description: error.message,
    });
    return false;
  }
}

// Función para transferir inventario entre almacenes
export async function transferInventory(
  productoId: string,
  origenId: string,
  destinoId: string,
  cantidad: number,
  motivo: string = 'Transferencia'
) {
  try {
    // Verificar que los almacenes existan
    const { data: almacenes, error: almacenesError } = await supabase
      .from("almacenes")  // Cambiado de "sucursales" a "almacenes"
      .select('id, nombre')
      .in('id', [origenId, destinoId]);
      
    if (almacenesError) throw almacenesError;
    if (!almacenes || almacenes.length !== 2) {
      throw new Error('Uno o ambos almacenes no existen');
    }
    
    // Verificar que hay suficiente stock en el origen
    const { data: inventarioOrigen, error: origenError } = await supabase
      .from('inventario')
      .select('cantidad')
      .eq('producto_id', productoId)
      .eq('almacen_id', origenId)  // Cambiado de sucursal_id a almacen_id
      .single();
      
    if (origenError) throw origenError;
    if (!inventarioOrigen || inventarioOrigen.cantidad < cantidad) {
      throw new Error('No hay suficiente stock para transferir');
    }
    
    // Realizar la transferencia como dos movimientos
    // 1. Salida del almacén origen
    const salida = await addInventoryMovement({
      producto_id: productoId,
      almacen_id: origenId,  // Cambiado de sucursal_id a almacen_id
      cantidad: cantidad,
      tipo: 'salida',
      motivo: `Transferencia a ${almacenes.find(a => a.id === destinoId)?.nombre || 'otro almacén'}`
    });
    
    // 2. Entrada al almacén destino
    const entrada = await addInventoryMovement({
      producto_id: productoId,
      almacen_id: destinoId,  // Cambiado de sucursal_id a almacen_id
      cantidad: cantidad,
      tipo: 'entrada',
      motivo: `Transferencia desde ${almacenes.find(a => a.id === origenId)?.nombre || 'otro almacén'}`
    });
    
    if (salida && entrada) {
      toast.success('Transferencia completada exitosamente');
      return true;
    } else {
      throw new Error('Error al procesar la transferencia');
    }
    
  } catch (error: any) {
    toast.error('Error en la transferencia', {
      description: error.message,
    });
    return false;
  }
}
