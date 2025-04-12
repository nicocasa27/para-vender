
import { supabase } from "@/integrations/supabase/client";

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
