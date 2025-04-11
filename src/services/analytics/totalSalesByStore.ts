
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StoreDataPoint } from "@/types/analytics";

export const fetchTotalSalesByStore = async (
  timeRange: string,
  storeIds: string[]
): Promise<StoreDataPoint[]> => {
  try {
    // Determine the date range based on timeRange
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7); // 7 days ago
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1); // 1 month ago
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1); // 1 year ago
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7); // Default to 7 days
    }
    
    // Convert dates to ISO format for Supabase
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    if (storeIds.length === 0) {
      return [];
    }
    
    // Get store information
    const { data: storesData, error: storesError } = await supabase
      .from('almacenes')
      .select('id, nombre')
      .in('id', storeIds);
      
    if (storesError) {
      throw storesError;
    }
    
    // Initialize result with store names and zero totals
    const result: StoreDataPoint[] = storesData.map(store => ({
      store_id: store.id,
      store_name: store.nombre,
      total: 0
    }));
    
    // Query sales for each store
    for (let i = 0; i < result.length; i++) {
      const store = result[i];
      
      const { data: salesData, error: salesError } = await supabase
        .from('ventas')
        .select('total')
        .eq('almacen_id', store.store_id)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);
        
      if (salesError) {
        throw salesError;
      }
      
      // Calculate total sales for the store
      const storeTotal = salesData.reduce((sum, sale) => sum + Number(sale.total), 0);
      result[i].total = Number(storeTotal.toFixed(1));
    }
    
    // Sort by total (descending)
    return result.sort((a, b) => b.total - a.total);
    
  } catch (error) {
    console.error('Error fetching total sales by store:', error);
    toast.error("Error al cargar ventas totales por tienda");
    
    // Return empty dataset on error
    return [];
  }
};
