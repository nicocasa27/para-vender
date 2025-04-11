
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TotalSalesByStoreDataPoint } from "@/types/analytics";
import { calculateDateRange } from "./utils";

export async function fetchTotalSalesByStore(storeIds: string[] = [], timeRange: string = "month"): Promise<TotalSalesByStoreDataPoint[]> {
  try {
    if (!storeIds || storeIds.length === 0) {
      console.log("No se proporcionaron tiendas para la consulta de ventas totales");
      return [];
    }

    const { startDate, endDate } = calculateDateRange(timeRange);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    console.log(`Obteniendo ventas totales desde ${startDateStr} hasta ${endDateStr} para tiendas:`, storeIds);
    
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, 
        total,
        almacen_id,
        almacenes(id, nombre)
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .in('almacen_id', storeIds);
    
    if (error) {
      console.error("Error al obtener datos de ventas totales:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No hay datos de ventas disponibles para el período seleccionado");
      return [];
    }
    
    console.log(`Se encontraron ${data.length} registros de ventas totales`);
    
    const storeData: Record<string, { id: string, nombre: string, total: number }> = {};
    
    data.forEach(sale => {
      const storeId = sale.almacen_id;
      const storeName = (sale.almacenes as any)?.nombre || 'Tienda desconocida';
      
      if (!storeData[storeId]) {
        storeData[storeId] = {
          id: storeId,
          nombre: storeName,
          total: 0
        };
      }
      
      storeData[storeId].total += Number(sale.total);
    });
    
    const chartData: TotalSalesByStoreDataPoint[] = Object.values(storeData);
    
    chartData.sort((a, b) => b.total - a.total);
    
    console.log("Datos procesados para el gráfico de ventas totales:", chartData);
    return chartData;
    
  } catch (error) {
    console.error('Error al obtener ventas totales por sucursal:', error);
    toast.error('Error al cargar los datos de ventas totales');
    return [];
  }
}
