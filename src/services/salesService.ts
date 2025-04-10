
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaleDetail {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Sale {
  id?: string;
  almacen_id: string;
  metodo_pago: string;
  cliente?: string | null;
  total: number;
  detalles: SaleDetail[];
}

export async function fetchSales(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, 
        total, 
        metodo_pago, 
        cliente, 
        created_at, 
        almacen_id, 
        almacenes(nombre)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    throw error;
  }
}

export async function fetchSaleDetails(saleId: string) {
  try {
    const { data, error } = await supabase
      .from('detalles_venta')
      .select(`
        id,
        cantidad,
        precio_unitario,
        subtotal,
        producto_id,
        productos(nombre, unidad_id, unidades(nombre))
      `)
      .eq('venta_id', saleId);
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error al obtener detalles de la venta ${saleId}:`, error);
    throw error;
  }
}

export async function createSale(sale: Sale) {
  try {
    console.log("🛒 Iniciando creación de venta:", sale);
    
    // 1. Validar datos básicos
    if (!sale.almacen_id) {
      throw new Error("El ID de la sucursal es requerido");
    }
    
    if (!sale.metodo_pago) {
      throw new Error("El método de pago es requerido");
    }
    
    if (!sale.detalles || sale.detalles.length === 0) {
      throw new Error("Los detalles de la venta son requeridos");
    }
    
    // 2. Crear la venta
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
    
    // 3. Crear los detalles de la venta
    const detallesVenta = sale.detalles.map(detalle => ({
      venta_id: ventaData.id,
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
    
    // 4. Actualizar el inventario (reducir stock)
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
      
      const { error: updateError } = await supabase
        .from('inventario')
        .update({ cantidad: nuevaCantidad })
        .eq('id', inventarioActual.id);
        
      if (updateError) {
        console.error(`❌ Error al actualizar inventario para producto ${detalle.producto_id}:`, updateError);
        throw updateError;
      }
      
      console.log(`✅ Inventario actualizado para producto ${detalle.producto_id}`);
      
      // Registrar el movimiento de salida
      const { error: movimientoError } = await supabase
        .from('movimientos')
        .insert({
          tipo: 'salida',
          producto_id: detalle.producto_id,
          almacen_origen_id: sale.almacen_id,
          cantidad: detalle.cantidad,
          notas: `Venta #${ventaData.id}`
        });
        
      if (movimientoError) {
        console.error(`❌ Error al registrar movimiento para producto ${detalle.producto_id}:`, movimientoError);
        throw movimientoError;
      }
      
      console.log(`✅ Movimiento registrado para producto ${detalle.producto_id}`);
    }));
    
    console.log("🎉 Venta completada correctamente");
    
    return {
      success: true,
      saleId: ventaData.id
    };
    
  } catch (error: any) {
    console.error("❌ Error al crear venta:", error);
    toast.error(`Error al procesar la venta: ${error.message}`);
    
    throw error;
  }
}

export async function fetchSalesToday() {
  try {
    // Obtener fecha de inicio y fin del día actual
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('ventas')
      .select('id, total, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error al obtener ventas del día:", error);
    throw error;
  }
}
