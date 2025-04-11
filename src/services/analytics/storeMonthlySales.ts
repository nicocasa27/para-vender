
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StoreMonthlySalesDataPoint } from "@/types/analytics";

export async function fetchStoreMonthlySales(storeIds: string[] = []): Promise<StoreMonthlySalesDataPoint[]> {
  try {
    if (!storeIds || storeIds.length === 0) {
      console.log("No se proporcionaron tiendas para la consulta");
      return [];
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    console.log(`Obteniendo ventas desde ${startDateStr} hasta ${endDateStr} para tiendas:`, storeIds);
    
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, 
        total,
        created_at,
        almacen_id
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .in('almacen_id', storeIds);
    
    if (error) {
      console.error("Error al obtener datos de ventas:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No hay datos de ventas disponibles para el período seleccionado");
      return [];
    }
    
    console.log(`Se encontraron ${data.length} registros de ventas`);
    
    const monthlyData: Record<string, Record<string, number>> = {};
    
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - i);
      const monthName = monthDate.toLocaleString('es-MX', { month: 'short' });
      const displayKey = `${monthName} ${monthDate.getFullYear()}`;
      months.unshift(displayKey);
      
      if (!monthlyData[displayKey]) {
        monthlyData[displayKey] = {};
      }
      
      storeIds.forEach(storeId => {
        monthlyData[displayKey][storeId] = 0;
      });
    }
    
    data.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const monthName = saleDate.toLocaleString('es-MX', { month: 'short' });
      const displayKey = `${monthName} ${saleDate.getFullYear()}`;
      
      if (monthlyData[displayKey] && sale.almacen_id) {
        monthlyData[displayKey][sale.almacen_id] = 
          (monthlyData[displayKey][sale.almacen_id] || 0) + Number(sale.total);
      }
    });
    
    const chartData = Object.entries(monthlyData)
      .map(([month, stores]) => ({
        month,
        ...stores
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        
        if (yearA !== yearB) {
          return Number(yearA) - Number(yearB);
        }
        
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return monthNames.indexOf(monthA.toLowerCase()) - monthNames.indexOf(monthB.toLowerCase());
      });
    
    console.log("Datos procesados para el gráfico:", chartData);
    return chartData;
    
  } catch (error) {
    console.error('Error al obtener ventas mensuales por sucursal:', error);
    toast.error('Error al cargar los datos de ventas mensuales');
    return [];
  }
}
