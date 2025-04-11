
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StoreMonthlySales {
  month: string;
  [storeName: string]: number | string;
}

export const fetchStoreMonthlySales = async (
  timeRange: string,
  storeIds: string[]
): Promise<StoreMonthlySales[]> => {
  try {
    // Determine how many months to look back based on period
    let monthsToLookBack = 3;
    switch (timeRange) {
      case "year":
        monthsToLookBack = 12;
        break;
      case "month":
        monthsToLookBack = 3;
        break;
      case "week":
        monthsToLookBack = 1;
        break;
      default:
        monthsToLookBack = 3;
    }
    
    if (storeIds.length === 0) {
      return [];
    }
    
    // Get store names
    const { data: storesData, error: storesError } = await supabase
      .from('almacenes')
      .select('id, nombre')
      .in('id', storeIds);
      
    if (storesError) {
      throw storesError;
    }
    
    const storeNames = new Map<string, string>();
    storesData?.forEach(store => {
      storeNames.set(store.id, store.nombre);
    });
    
    // Calculate date range for query
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - monthsToLookBack);
    startDate.setDate(1); // First day of month
    
    // Get sales data for each store
    const salesByMonth = new Map<string, Map<string, number>>();
    
    // Initialize months
    const months = [];
    for (let i = 0; i < monthsToLookBack; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('es-ES', { month: 'long' });
      months.unshift(monthName); // Add to beginning to keep chronological order
      
      // Initialize month data
      salesByMonth.set(monthName, new Map<string, number>());
      storeIds.forEach(storeId => {
        salesByMonth.get(monthName)?.set(storeId, 0);
      });
    }
    
    // Query sales for each store
    for (const storeId of storeIds) {
      const { data: salesData, error: salesError } = await supabase
        .from('ventas')
        .select('total, created_at')
        .eq('almacen_id', storeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', today.toISOString());
        
      if (salesError) {
        throw salesError;
      }
      
      // Aggregate sales by month
      salesData?.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        const monthName = saleDate.toLocaleString('es-ES', { month: 'long' });
        
        if (salesByMonth.has(monthName)) {
          const storeMonthSales = salesByMonth.get(monthName);
          const currentTotal = storeMonthSales?.get(storeId) || 0;
          storeMonthSales?.set(storeId, currentTotal + Number(sale.total));
        }
      });
    }
    
    // Format data for chart
    const result: StoreMonthlySales[] = months.map(month => {
      const entry: StoreMonthlySales = { month };
      
      storeIds.forEach(storeId => {
        const storeName = storeNames.get(storeId) || `Tienda ${storeId.substring(0, 4)}`;
        const total = salesByMonth.get(month)?.get(storeId) || 0;
        entry[storeName] = Number(total.toFixed(1));
      });
      
      return entry;
    });
    
    return result;
    
  } catch (error) {
    console.error('Error fetching store monthly sales:', error);
    toast.error("Error al cargar ventas mensuales por tienda");
    
    // Return empty dataset on error
    return [];
  }
};
