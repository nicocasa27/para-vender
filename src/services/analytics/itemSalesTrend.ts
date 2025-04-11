
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ItemSalesTrend {
  date: string;
  [productName: string]: number | string;
}

export const fetchItemSalesTrend = async (
  timeRange: string,
  storeId: string | null,
  productIds: string[]
): Promise<ItemSalesTrend[]> => {
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
    
    if (productIds.length === 0) {
      return [];
    }
    
    // Build the query
    let query = supabase
      .from('detalles_venta')
      .select(`
        cantidad,
        producto_id,
        productos:producto_id(id, nombre),
        ventas:venta_id(id, created_at, almacen_id)
      `)
      .gte('ventas.created_at', startDateStr)
      .lte('ventas.created_at', endDateStr)
      .in('producto_id', productIds);
    
    // Filter by store if provided
    if (storeId) {
      query = query.eq('ventas.almacen_id', storeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Group sales by date and product
    const salesByDay = new Map<string, Map<string, number>>();
    const productNames = new Map<string, string>();
    
    if (data && data.length > 0) {
      data.forEach(item => {
        if (!item.ventas || !item.productos) return;
        
        const saleDate = new Date(item.ventas.created_at);
        const dateStr = saleDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        const productId = item.producto_id;
        const productName = item.productos.nombre;
        const cantidad = Number(item.cantidad) || 0;
        
        // Store product name for later use
        productNames.set(productId, productName);
        
        // Initialize date entry if it doesn't exist
        if (!salesByDay.has(dateStr)) {
          salesByDay.set(dateStr, new Map<string, number>());
        }
        
        // Get current count and add quantity
        const productSales = salesByDay.get(dateStr)!;
        const currentCount = productSales.get(productId) || 0;
        productSales.set(productId, currentCount + cantidad);
      });
    }
    
    // Convert to expected format for chart
    const dates = Array.from(salesByDay.keys()).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    const result: ItemSalesTrend[] = dates.map(date => {
      const entry: ItemSalesTrend = { date };
      
      // Add each product's sales for the date
      productIds.forEach(productId => {
        const productName = productNames.get(productId) || `Product ${productId.substring(0, 4)}`;
        const sales = salesByDay.get(date)?.get(productId) || 0;
        entry[productName] = sales;
      });
      
      return entry;
    });
    
    return result;
    
  } catch (error) {
    console.error('Error fetching item sales trend:', error);
    toast.error("Error al cargar la tendencia de ventas por ítem");
    
    // Return empty dataset on error
    return [];
  }
};
