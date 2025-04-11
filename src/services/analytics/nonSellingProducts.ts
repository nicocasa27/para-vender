
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NonSellingProduct {
  name: string;
  current: number;
  previous: number;
  change: number;
}

export const fetchNonSellingProducts = async (
  timeRange: string,
  storeId: string | null
): Promise<NonSellingProduct[]> => {
  try {
    // Determine date ranges for current and previous periods
    const today = new Date();
    let currentStartDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();
    
    switch (timeRange) {
      case "week":
        currentStartDate.setDate(today.getDate() - 7);
        previousStartDate.setDate(today.getDate() - 14);
        previousEndDate.setDate(today.getDate() - 7);
        break;
      case "month":
        currentStartDate.setDate(today.getDate() - 30);
        previousStartDate.setDate(today.getDate() - 60);
        previousEndDate.setDate(today.getDate() - 30);
        break;
      case "year":
        currentStartDate.setMonth(today.getMonth() - 12);
        previousStartDate.setMonth(today.getMonth() - 24);
        previousEndDate.setMonth(today.getMonth() - 12);
        break;
      default:
        currentStartDate.setDate(today.getDate() - 7);
        previousStartDate.setDate(today.getDate() - 14);
        previousEndDate.setDate(today.getDate() - 7);
    }
    
    // Get all products
    let productQuery = supabase
      .from('productos')
      .select('id, nombre')
      .limit(100); // Limit to prevent performance issues
      
    const { data: products, error: prodError } = await productQuery;
    
    if (prodError) {
      throw prodError;
    }
    
    if (!products || products.length === 0) {
      return [];
    }
    
    // Initialize product sales map
    const productSalesMap: Record<string, { name: string, current: number, previous: number }> = {};
    products.forEach(prod => {
      productSalesMap[prod.id] = { name: prod.nombre, current: 0, previous: 0 };
    });
    
    // Get current period sales
    let currentQuery = supabase
      .from('detalles_venta')
      .select(`
        producto_id, 
        cantidad,
        ventas:venta_id(almacen_id, created_at)
      `)
      .gte('ventas.created_at', currentStartDate.toISOString())
      .lte('ventas.created_at', today.toISOString());
      
    if (storeId) {
      currentQuery = currentQuery.eq('ventas.almacen_id', storeId);
    }
    
    const { data: currentSales, error: currentError } = await currentQuery;
    
    if (currentError) {
      throw currentError;
    }
    
    // Process current period sales
    if (currentSales && currentSales.length > 0) {
      currentSales.forEach(sale => {
        if (!sale.ventas) return;
        
        const productId = sale.producto_id;
        if (!productId || !productSalesMap[productId]) return;
        
        const cantidad = Number(sale.cantidad) || 0;
        productSalesMap[productId].current += cantidad;
      });
    }
    
    // Get previous period sales
    let previousQuery = supabase
      .from('detalles_venta')
      .select(`
        producto_id, 
        cantidad,
        ventas:venta_id(almacen_id, created_at)
      `)
      .gte('ventas.created_at', previousStartDate.toISOString())
      .lte('ventas.created_at', previousEndDate.toISOString());
      
    if (storeId) {
      previousQuery = previousQuery.eq('ventas.almacen_id', storeId);
    }
    
    const { data: previousSales, error: previousError } = await previousQuery;
    
    if (previousError) {
      throw previousError;
    }
    
    // Process previous period sales
    if (previousSales && previousSales.length > 0) {
      previousSales.forEach(sale => {
        if (!sale.ventas) return;
        
        const productId = sale.producto_id;
        if (!productId || !productSalesMap[productId]) return;
        
        const cantidad = Number(sale.cantidad) || 0;
        productSalesMap[productId].previous += cantidad;
      });
    }
    
    // Calculate changes and format data for chart
    const salesChanges: NonSellingProduct[] = Object.values(productSalesMap)
      .map(product => {
        let changePercent = 0;
        
        if (product.previous > 0) {
          changePercent = ((product.current - product.previous) / product.previous) * 100;
        } else if (product.current > 0) {
          changePercent = 100; // New product with sales
        }
        
        return {
          name: product.name,
          current: product.current,
          previous: product.previous,
          change: Number(changePercent.toFixed(1))
        };
      })
      // Filter for products with significant negative change
      .filter(product => product.previous > 0 && product.change < 0)
      // Sort by largest negative change first
      .sort((a, b) => a.change - b.change)
      // Take top 8 worst performing products
      .slice(0, 8);
    
    return salesChanges;
    
  } catch (error) {
    console.error('Error fetching non-selling products:', error);
    toast.error("Error al cargar productos sin ventas");
    
    // Return empty dataset on error
    return [];
  }
};
