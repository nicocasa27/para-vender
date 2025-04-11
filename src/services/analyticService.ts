
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ItemSalesTrendDataPoint, StoreMonthlySalesDataPoint } from "@/types/analytics";

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
        ventas:venta_id(id, created_at, almacen_id, almacenes:almacen_id(id, nombre))
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
      const venta = item.ventas as any;
      const producto = item.productos as any;
      
      // Formatear fecha como YYYY-MM-DD
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

export async function fetchStoreMonthlySales(storeIds: string[] = []) {
  try {
    if (!storeIds || storeIds.length === 0) {
      console.log("No se proporcionaron tiendas para la consulta");
      return [];
    }

    // Get sales data for the last 12 months
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 11); // Last 12 months
    startDate.setDate(1); // First day of the month
    startDate.setHours(0, 0, 0, 0);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    console.log(`Obteniendo ventas desde ${startDateStr} hasta ${endDateStr} para tiendas:`, storeIds);
    
    // Fetch all sales for the selected stores in the date range
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
    
    // Process data to group by month and store
    const monthlyData: Record<string, Record<string, number>> = {};
    
    // Initialize all months for all stores with zero
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
      
      // Initialize each store with 0
      storeIds.forEach(storeId => {
        monthlyData[displayKey][storeId] = 0;
      });
    }
    
    // Sum sales by month and store
    data.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const monthName = saleDate.toLocaleString('es-MX', { month: 'short' });
      const displayKey = `${monthName} ${saleDate.getFullYear()}`;
      
      if (monthlyData[displayKey] && sale.almacen_id) {
        monthlyData[displayKey][sale.almacen_id] = 
          (monthlyData[displayKey][sale.almacen_id] || 0) + Number(sale.total);
      }
    });
    
    // Convert to array format for the chart
    const chartData = Object.entries(monthlyData)
      .map(([month, stores]) => ({
        month,
        ...stores
      }))
      .sort((a, b) => {
        // Extract year and month for proper sorting
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        
        if (yearA !== yearB) {
          return Number(yearA) - Number(yearB);
        }
        
        // Convert month names to numbers for sorting
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
