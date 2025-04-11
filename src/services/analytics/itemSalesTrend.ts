
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ItemSalesTrendDataPoint } from "@/types/analytics";
import { calculateDateRange } from "./utils";

export async function fetchItemSalesTrend(storeIds: string[] = [], timeRange: string = "month"): Promise<ItemSalesTrendDataPoint[]> {
  try {
    const { startDate, endDate } = calculateDateRange(timeRange);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    let query = supabase
      .from('detalles_venta')
      .select(`
        cantidad,
        precio_unitario,
        created_at,
        productos:producto_id(id, nombre),
        ventas:venta_id(id, created_at, almacen_id, almacenes:almacen_id(id, nombre))
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);
    
    if (storeIds && storeIds.length > 0) {
      query = query.in('ventas.almacen_id', storeIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No hay datos disponibles para el período seleccionado");
      return [];
    }
    
    const processedData: ItemSalesTrendDataPoint[] = data.map(item => {
      const venta = item.ventas as any;
      const producto = item.productos as any;
      
      const date = new Date(venta.created_at);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      return {
        fecha: formattedDate,
        producto: producto?.nombre || 'Producto desconocido',
        almacen: venta.almacenes?.nombre || 'Tienda desconocida',
        almacen_id: venta.almacen_id,
        cantidad: Number(item.cantidad)
      };
    });
    
    return processedData;
    
  } catch (error) {
    console.error('Error al obtener la tendencia de ventas por ítem:', error);
    toast.error('Error al cargar los datos de tendencia de ventas');
    return [];
  }
}
