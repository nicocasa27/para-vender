
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ItemSalesTrendDataPoint } from "@/types/analytics";

export async function fetchItemSalesTrend(storeIds: string[] = [], timeRange: string = "month") {
  try {
    // Determinar rango de fecha basado en timeRange
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Convertir fechas a formato ISO
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Construir consulta
    let query = supabase
      .from('detalles_venta')
      .select(`
        cantidad,
        precio_unitario,
        created_at,
        productos:producto_id(id, nombre),
        ventas:venta_id(id, created_at, almacen_id, almacenes(id, nombre))
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);
    
    // Filtrar por tiendas si se proporciona
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
    
    // Procesar los datos en el formato requerido
    const processedData: ItemSalesTrendDataPoint[] = data.map(item => {
      // Formatear fecha como YYYY-MM-DD
      const date = new Date(item.ventas.created_at);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      return {
        fecha: formattedDate,
        producto: item.productos?.nombre || 'Producto desconocido',
        almacen: item.ventas.almacenes?.nombre || 'Tienda desconocida',
        almacen_id: item.ventas.almacen_id,
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
