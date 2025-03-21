import { supabase } from "@/integrations/supabase/client";

export type SalesByCategory = {
  name: string;
  value: number;
};

export type SalesByStore = {
  name: string;
  sales: number;
  profit: number;
};

export type SalesData = {
  date: string;
  revenue: number;
  profit: number;
};

export type InventoryData = {
  date: string;
  level: number;
};

export type TopSellingProduct = {
  name: string;
  value: number;
};

// Fetch sales data by category
export async function fetchSalesByCategory(): Promise<SalesByCategory[]> {
  try {
    // First get all categories with products
    const { data: categorias, error: categoriasError } = await supabase
      .from('categorias')
      .select('id, nombre');

    if (categoriasError) {
      console.error('Error fetching categorias:', categoriasError);
      return [];
    }

    const salesByCategory: SalesByCategory[] = [];
    
    // For each category, fetch actual sales data
    for (const categoria of categorias) {
      // Get products in this category
      const { data: productos, error: productosError } = await supabase
        .from('productos')
        .select('id')
        .eq('categoria_id', categoria.id);
      
      if (productosError) {
        console.error('Error fetching productos:', productosError);
        continue;
      }

      if (productos && productos.length > 0) {
        // Get sales for these products
        let categoryTotal = 0;
        
        for (const producto of productos) {
          const { data: ventas, error: ventasError } = await supabase
            .from('detalles_venta')
            .select('subtotal')
            .eq('producto_id', producto.id);
            
          if (ventasError) {
            console.error('Error fetching detalles_venta:', ventasError);
            continue;
          }
          
          if (ventas && ventas.length > 0) {
            // Sum up sales for this product
            categoryTotal += ventas.reduce((sum, venta) => sum + (venta.subtotal || 0), 0);
          }
        }
        
        // Add to results if there are sales
        salesByCategory.push({
          name: categoria.nombre,
          value: categoryTotal
        });
      }
    }

    // If we have data, calculate percentages
    if (salesByCategory.length > 0) {
      const total = salesByCategory.reduce((sum, item) => sum + item.value, 0);
      return salesByCategory.map(item => ({
        ...item,
        value: total > 0 ? Math.round((item.value / total) * 100) : 0
      }));
    } else {
      // If no sales data, return empty array
      return [];
    }
  } catch (error) {
    console.error('Error in fetchSalesByCategory:', error);
    return [];
  }
}

// Fetch store performance data from real store data
export async function fetchStorePerformance(): Promise<SalesByStore[]> {
  try {
    // Get all stores
    const { data: almacenes, error: almacenesError } = await supabase
      .from('almacenes')
      .select('id, nombre');

    if (almacenesError) {
      console.error('Error fetching almacenes:', almacenesError);
      return [];
    }

    const storePerformance: SalesByStore[] = [];
    
    // For each store, get all sales
    for (const almacen of almacenes) {
      // Get sales for this store
      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select('id, total')
        .eq('almacen_id', almacen.id);
      
      if (ventasError) {
        console.error('Error fetching ventas:', ventasError);
        continue;
      }
      
      // Calculate total sales for this store
      const sales = ventas ? ventas.reduce((sum, venta) => sum + venta.total, 0) : 0;
      
      // Estimate profit (assuming a 30% margin)
      const profit = sales * 0.3;
      
      storePerformance.push({
        name: almacen.nombre,
        sales: Math.round(sales),
        profit: Math.round(profit)
      });
    }

    return storePerformance;
  } catch (error) {
    console.error('Error in fetchStorePerformance:', error);
    return [];
  }
}

// Helper function to get the current date formatted as a string
function formatDate(date: Date, format: 'day' | 'week' | 'month'): string {
  if (format === 'day') {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  } else if (format === 'week') {
    const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
    return `Semana ${weekNumber}`;
  } else {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[date.getMonth()];
  }
}

// Helper function to get recent dates
function getRecentDates(format: 'month' | 'week', count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  if (format === 'week') {
    // Get the last 'count' weeks
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - (i * 7));
      dates.push(formatDate(date, 'week'));
    }
  } else {
    // Get the last 'count' months including the current one
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      dates.push(formatDate(date, 'month'));
    }
  }
  
  return dates;
}

// Generate sales trend data based on real sales from database
export async function fetchSalesTrend(): Promise<SalesData[]> {
  try {
    // Get actual sales data
    const { data: ventas, error: ventasError } = await supabase
      .from('ventas')
      .select('id, total, created_at')
      .order('created_at', { ascending: true });

    if (ventasError) {
      console.error('Error fetching ventas:', ventasError);
      return [];
    }

    // Get recent months
    const recentMonths = getRecentDates('month', 12);
    const salesData: SalesData[] = recentMonths.map(month => ({
      date: month,
      revenue: 0,
      profit: 0
    }));

    // Aggregate sales by month
    if (ventas && ventas.length > 0) {
      ventas.forEach(venta => {
        const ventaDate = new Date(venta.created_at);
        const monthKey = formatDate(ventaDate, 'month');
        
        // Find the corresponding month in our sales data
        const monthData = salesData.find(item => item.date === monthKey);
        if (monthData) {
          monthData.revenue += venta.total;
          // Estimate profit (assuming a 30% margin)
          monthData.profit += venta.total * 0.3;
        }
      });
    }

    return salesData;
  } catch (error) {
    console.error('Error in fetchSalesTrend:', error);
    return [];
  }
}

// Fetch inventory levels using real data
export async function fetchInventoryLevels(): Promise<InventoryData[]> {
  try {
    // Get current inventory levels by store
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario')
      .select('cantidad, updated_at');

    if (inventarioError) {
      console.error('Error fetching inventario:', inventarioError);
      return [];
    }

    // Create a map to track inventory by week
    const inventoryByWeek = new Map<string, number>();
    
    // Get last 12 weeks
    const weeks = getRecentDates('week', 12);
    
    // Initialize all weeks with zero
    weeks.forEach(week => {
      inventoryByWeek.set(week, 0);
    });
    
    // Group inventory data by week
    if (inventario && inventario.length > 0) {
      inventario.forEach(item => {
        const itemDate = new Date(item.updated_at);
        const weekKey = formatDate(itemDate, 'week');
        
        // If this week is in our report range, add the inventory
        if (inventoryByWeek.has(weekKey)) {
          inventoryByWeek.set(weekKey, (inventoryByWeek.get(weekKey) || 0) + item.cantidad);
        }
      });
    }
    
    // Convert map to the required format
    const inventoryData: InventoryData[] = [];
    
    weeks.forEach(week => {
      inventoryData.push({
        date: week,
        level: inventoryByWeek.get(week) || 0
      });
    });

    return inventoryData;
  } catch (error) {
    console.error('Error in fetchInventoryLevels:', error);
    return [];
  }
}

// New function to fetch top selling products
export async function fetchTopSellingProducts(timeRange: 'daily' | 'weekly' | 'monthly' = 'monthly', storeId: string | null = null): Promise<TopSellingProduct[]> {
  try {
    console.log(`fetchTopSellingProducts called with timeRange: ${timeRange}, storeId: ${storeId || 'all'}`);
    
    // Get sales data with product details
    let query = supabase
      .from('detalles_venta')
      .select(`
        cantidad,
        subtotal,
        producto_id,
        venta_id,
        productos:producto_id(nombre),
        ventas:venta_id(created_at, almacen_id)
      `);
    
    // Apply time filter based on timeRange
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === 'daily') {
      // Last 24 hours
      startDate.setDate(now.getDate() - 1);
    } else if (timeRange === 'weekly') {
      // Last 7 days
      startDate.setDate(now.getDate() - 7);
    } else {
      // Last 30 days
      startDate.setMonth(now.getMonth() - 1);
    }
    
    const isoStartDate = startDate.toISOString();
    console.log(`Date filter: ${isoStartDate} to now`);
    
    // Filter by date
    query = query.gte('ventas.created_at', isoStartDate);
    
    // Filter by store if specified
    if (storeId) {
      console.log(`Filtering by store: ${storeId}`);
      query = query.eq('ventas.almacen_id', storeId);
    }
    
    const { data: salesData, error } = await query;
    
    if (error) {
      console.error('Error fetching top selling products:', error);
      return [];
    }
    
    console.log(`Retrieved ${salesData?.length || 0} sales records`);
    
    // Process the sales data to get top selling products
    const productSales: Record<string, { name: string; value: number }> = {};
    
    salesData?.forEach(sale => {
      const productId = sale.producto_id;
      const productName = sale.productos?.nombre || 'Producto Desconocido';
      const quantity = Number(sale.cantidad) || 0;
      
      if (!productSales[productId]) {
        productSales[productId] = {
          name: productName,
          value: 0
        };
      }
      
      productSales[productId].value += quantity;
    });
    
    // Convert to array and sort by quantity sold
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Get top 10 products
    
    console.log(`Returning ${topProducts.length} top products`);
    return topProducts;
  } catch (error) {
    console.error('Error in fetchTopSellingProducts:', error);
    return [];
  }
}
