
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ItemSalesTrendData {
  id: string;
  name: string;
  series: {
    date: string;
    value: number;
  }[];
}

interface DataPoint {
  date: string;
  [key: string]: number | string;
}

export async function fetchItemSalesTrend(
  period: "weekly" | "monthly" = "monthly",
  storeIds: string[] | null = null,
  limit: number = 5
): Promise<ItemSalesTrendData[]> {
  try {
    const today = new Date();
    const startDate = new Date();
    
    if (period === "weekly") {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setMonth(today.getMonth() - 6);
    }

    // Consulta para obtener los productos más vendidos
    let query = supabase
      .from('detalles_venta')
      .select(`
        cantidad,
        producto_id,
        productos:productos(id, nombre),
        ventas:venta_id(id, created_at, almacen_id)
      `)
      .gte('ventas.created_at', startDate.toISOString())
      .order('ventas.created_at');

    if (storeIds && storeIds.length > 0) {
      query = query.in('ventas.almacen_id', storeIds);
    }

    const { data: salesData, error } = await query;

    if (error) {
      console.error("Error fetching sales trend data:", error);
      toast.error("Error al cargar tendencia de ventas");
      return [];
    }

    if (!salesData || salesData.length === 0) {
      return [];
    }
    
    // Agrupar por producto y sumar las cantidades por fecha
    const productSales: Record<string, Record<string, number>> = {};
    const productNames: Record<string, string> = {};
    
    salesData.forEach((sale: any) => {
      if (!sale.productos || !sale.ventas) return;
      
      const productId = sale.producto_id;
      const productName = sale.productos.nombre;
      const saleDate = new Date(sale.ventas.created_at);
      let dateKey;
      
      if (period === "weekly") {
        dateKey = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        dateKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }
      
      if (!productSales[productId]) {
        productSales[productId] = {};
      }
      
      if (!productSales[productId][dateKey]) {
        productSales[productId][dateKey] = 0;
      }
      
      productSales[productId][dateKey] += Number(sale.cantidad) || 0;
      productNames[productId] = productName;
    });
    
    // Calcular el total de ventas por producto para encontrar los más vendidos
    const productTotals: Record<string, number> = {};
    
    Object.entries(productSales).forEach(([productId, salesByDate]) => {
      productTotals[productId] = Object.values(salesByDate).reduce((acc, val) => acc + val, 0);
    });
    
    // Obtener los productos más vendidos (limited by 'limit' parameter)
    const topProductIds = Object.entries(productTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    
    // Formatear los datos para la gráfica
    const result: ItemSalesTrendData[] = topProductIds.map(productId => {
      const series = Object.entries(productSales[productId]).map(([date, value]) => ({
        date,
        value
      }));
      
      return {
        id: productId,
        name: productNames[productId] || `Producto ${productId}`,
        series: series.sort((a, b) => a.date.localeCompare(b.date))
      };
    });
    
    return result;
  } catch (error) {
    console.error("Error in fetchItemSalesTrend:", error);
    toast.error("Error al obtener tendencia de ventas");
    return [];
  }
}
