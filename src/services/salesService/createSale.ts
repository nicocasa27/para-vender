
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sale } from "./types";

export async function createSale(sale: Sale) {
  try {
    console.log("🛒 Iniciando creación de venta:", sale);
    
    validateSaleData(sale);
    const ventaId = await createVentaRecord(sale);
    await createVentaDetails(ventaId, sale.detalles);
    await updateInventoryForSale(sale);
    
    console.log("🎉 Venta completada correctamente");
    
    return {
      success: true,
      saleId: ventaId
    };
    
  } catch (error: any) {
    console.error("❌ Error al crear venta:", error);
    toast.error(`Error al procesar la venta: ${error.message}`);
    throw error;
  }
}

function validateSaleData(sale: Sale) {
  if (!sale.almacen_id) {
    throw new Error("El ID de la sucursal es requerido");
  }
  
  if (!sale.metodo_pago) {
    throw new Error("El método de pago es requerido");
  }
  
  if (!sale.detalles || sale.detalles.length === 0) {
    throw new Error("Los detalles de la venta son requeridos");
  }
}

async function createVentaRecord(sale: Sale): Promise<string> {
  const { data: ventaData, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      total: sale.total,
      metodo_pago: sale.metodo_pago,
      cliente: sale.cliente || null,
      almacen_id: sale.almacen_id,
      estado: 'completada'
    })
    .select('id')
    .single();
    
  if (ventaError) {
    console.error("❌ Error al crear la venta:", ventaError);
    throw ventaError;
  }
  
  console.log("✅ Venta creada con ID:", ventaData.id);
  return ventaData.id;
}

async function createVentaDetails(ventaId: string, detalles: Sale['detalles']) {
  const detallesVenta = detalles.map(detalle => ({
    venta_id: ventaId,
    producto_id: detalle.producto_id,
    cantidad: detalle.cantidad,
    precio_unitario: detalle.precio_unitario,
    subtotal: detalle.subtotal
  }));
  
  const { error: detallesError } = await supabase
    .from('detalles_venta')
    .insert(detallesVenta);
    
  if (detallesError) {
    console.error("❌ Error al guardar detalles de venta:", detallesError);
    throw detallesError;
  }
  
  console.log("✅ Detalles de venta guardados");
}

async function updateInventoryForSale(sale: Sale) {
  await Promise.all(sale.detalles.map(async (detalle) => {
    // Buscar el registro actual de inventario
    const { data: inventarioActual, error: inventarioError } = await supabase
      .from('inventario')
      .select('id, cantidad')
      .eq('producto_id', detalle.producto_id)
      .eq('almacen_id', sale.almacen_id)
      .maybeSingle();
      
    if (inventarioError) {
      console.error(`❌ Error al obtener inventario para producto ${detalle.producto_id}:`, inventarioError);
      throw inventarioError;
    }
    
    if (!inventarioActual) {
      console.error(`❌ No existe registro de inventario para producto ${detalle.producto_id} en esta sucursal`);
      throw new Error(`No existe registro de inventario para producto ${detalle.producto_id} en esta sucursal`);
    }
    
    // Actualizar el inventario
    const nuevaCantidad = Number(inventarioActual.cantidad) - detalle.cantidad;
    
    if (nuevaCantidad < 0) {
      throw new Error(`Stock insuficiente para el producto ${detalle.producto_id}`);
    }
    
    await updateInventoryQuantity(inventarioActual.id, nuevaCantidad);
    await registerMovement(detalle.producto_id, sale.almacen_id, detalle.cantidad, sale.id);
  }));
}

async function updateInventoryQuantity(inventarioId: string, nuevaCantidad: number) {
  const { error: updateError } = await supabase
    .from('inventario')
    .update({ cantidad: nuevaCantidad })
    .eq('id', inventarioId);
    
  if (updateError) {
    console.error(`❌ Error al actualizar inventario:`, updateError);
    throw updateError;
  }
}

async function registerMovement(productoId: string, almacenId: string, cantidad: number, ventaId?: string) {
  const { error: movimientoError } = await supabase
    .from('movimientos')
    .insert({
      tipo: 'salida',
      producto_id: productoId,
      almacen_origen_id: almacenId,
      cantidad: cantidad,
      notas: ventaId ? `Venta #${ventaId}` : 'Venta'
    });
    
  if (movimientoError) {
    console.error(`❌ Error al registrar movimiento para producto ${productoId}:`, movimientoError);
    throw movimientoError;
  }
  
  console.log(`✅ Movimiento registrado para producto ${productoId}`);
}
