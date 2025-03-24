
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
  turnover: number;
};

export type TopSellingProduct = {
  name: string;
  value: number;
};

export type CustomerSegment = {
  name: string;
  value: number;
  spending: number;
};

export type HourlyDistribution = {
  hour: number;
  transactions: number;
  amount: number;
};

export type ProductProfitability = {
  name: string;
  sales: number;
  margin: number;
  revenue: number;
};

export type ProductPopularity = {
  name: string;
  sales: number;
};

// Fetch sales data by category with time range and store filter
export async function fetchSalesByCategory(timeRange = 'monthly', storeFilter = 'all'): Promise<SalesByCategory[]> {
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
        // Get sales for these products with time filter
        let categoryTotal = 0;
        
        // Apply time filter
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - getTimeRangeDays(timeRange));
        
        for (const producto of productos) {
          let ventasQuery = supabase
            .from('detalles_venta')
            .select('subtotal, venta_id, ventas:venta_id(created_at, almacen_id)')
            .eq('producto_id', producto.id)
            .gte('ventas.created_at', thirtyDaysAgo.toISOString());
            
          // Apply store filter if not "all"
          if (storeFilter !== 'all') {
            ventasQuery = ventasQuery.eq('ventas.almacen_id', storeFilter);
          }
          
          const { data: ventas, error: ventasError } = await ventasQuery;
            
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

// Helper function to convert timeRange to days
function getTimeRangeDays(timeRange: string): number {
  switch(timeRange) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'yearly': return 365;
    default: return 30;
  }
}

// Fetch store performance data with time filter
export async function fetchStorePerformance(timeRange = 'monthly'): Promise<SalesByStore[]> {
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
    
    // Apply time filter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - getTimeRangeDays(timeRange));
    
    // For each store, get all sales in the time period
    for (const almacen of almacenes) {
      // Get sales for this store
      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select('id, total')
        .eq('almacen_id', almacen.id)
        .gte('created_at', startDate.toISOString());
      
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

// Generate sales trend data based on real sales with time filter
export async function fetchSalesTrend(timeRange = 'monthly'): Promise<SalesData[]> {
  try {
    let format: 'month' | 'week';
    let count: number;
    
    // Set format and count based on timeRange
    switch (timeRange) {
      case 'daily':
      case 'weekly':
        format = 'week';
        count = 12; // Last 12 weeks
        break;
      case 'monthly':
      case 'yearly':
      default:
        format = 'month';
        count = 12; // Last 12 months
        break;
    }

    // Get actual sales data with time filter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - getTimeRangeDays(timeRange));
    
    const { data: ventas, error: ventasError } = await supabase
      .from('ventas')
      .select('id, total, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (ventasError) {
      console.error('Error fetching ventas:', ventasError);
      return [];
    }

    // Get recent dates
    const recentDates = getRecentDates(format, count);
    const salesData: SalesData[] = recentDates.map(date => ({
      date,
      revenue: 0,
      profit: 0
    }));

    // Aggregate sales by period
    if (ventas && ventas.length > 0) {
      ventas.forEach(venta => {
        const ventaDate = new Date(venta.created_at);
        const periodKey = formatDate(ventaDate, format);
        
        // Find the corresponding period in our sales data
        const periodData = salesData.find(item => item.date === periodKey);
        if (periodData) {
          periodData.revenue += venta.total;
          // Estimate profit (assuming a 30% margin)
          periodData.profit += venta.total * 0.3;
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
    const inventoryByWeek = new Map<string, { level: number, sales: number }>();
    
    // Get last 12 weeks
    const weeks = getRecentDates('week', 12);
    
    // Initialize all weeks with zero
    weeks.forEach(week => {
      inventoryByWeek.set(week, { level: 0, sales: Math.floor(Math.random() * 50) + 10 });
    });
    
    // Group inventory data by week
    if (inventario && inventario.length > 0) {
      inventario.forEach(item => {
        const itemDate = new Date(item.updated_at);
        const weekKey = formatDate(itemDate, 'week');
        
        // If this week is in our report range, add the inventory
        if (inventoryByWeek.has(weekKey)) {
          const current = inventoryByWeek.get(weekKey) || { level: 0, sales: 0 };
          inventoryByWeek.set(weekKey, { 
            ...current,
            level: current.level + item.cantidad
          });
        }
      });
    }
    
    // Convert map to the required format and calculate inventory turnover
    const inventoryData: InventoryData[] = [];
    
    weeks.forEach(week => {
      const data = inventoryByWeek.get(week) || { level: 0, sales: 0 };
      const turnover = data.level > 0 ? +(data.sales / data.level).toFixed(2) : 0;
      
      inventoryData.push({
        date: week,
        level: data.level,
        turnover: turnover
      });
    });

    return inventoryData;
  } catch (error) {
    console.error('Error in fetchInventoryLevels:', error);
    return [];
  }
}

// Generate customer segmentation data
export async function fetchCustomerSegmentation(): Promise<CustomerSegment[]> {
  // In a real application, this would fetch from a customers table
  // For demo purposes, we'll return mock data
  return [
    { name: 'Nuevos', value: 30, spending: 1200 },
    { name: 'Frecuentes', value: 45, spending: 3500 },
    { name: 'VIP', value: 15, spending: 5800 },
    { name: 'Inactivos', value: 10, spending: 800 }
  ];
}

// Generate hourly distribution data
export async function fetchSalesHourlyDistribution(): Promise<HourlyDistribution[]> {
  // In a real application, this would aggregate sales by hour
  // For demo purposes, we'll return mock data for a typical business day
  return Array.from({ length: 24 }, (_, i) => {
    // Create a realistic distribution with peak hours
    let transactions = 0;
    let amount = 0;
    
    if (i >= 8 && i <= 20) {
      // Business hours
      if (i >= 11 && i <= 13) {
        // Lunch peak
        transactions = Math.floor(Math.random() * 30) + 50;
        amount = Math.floor(Math.random() * 8000) + 12000;
      } else if (i >= 17 && i <= 19) {
        // Evening peak
        transactions = Math.floor(Math.random() * 25) + 40;
        amount = Math.floor(Math.random() * 6000) + 10000;
      } else {
        // Regular business hours
        transactions = Math.floor(Math.random() * 15) + 20;
        amount = Math.floor(Math.random() * 4000) + 5000;
      }
    } else {
      // Non-business hours
      transactions = Math.floor(Math.random() * 5);
      amount = Math.floor(Math.random() * 1000);
    }
    
    return {
      hour: i,
      transactions,
      amount
    };
  });
}

// Generate product profitability data
export async function fetchProductProfitability(): Promise<ProductProfitability[]> {
  try {
    // Get products with prices
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, precio_compra, precio_venta');
      
    if (productosError) {
      console.error('Error fetching productos:', productosError);
      return [];
    }
    
    const result: ProductProfitability[] = [];
    
    // Get sales data for each product
    for (const producto of (productos || [])) {
      const { data: ventas, error: ventasError } = await supabase
        .from('detalles_venta')
        .select('cantidad, subtotal')
        .eq('producto_id', producto.id);
        
      if (ventasError) {
        console.error('Error fetching ventas:', ventasError);
        continue;
      }
      
      // Calculate sales quantity
      const sales = ventas ? ventas.reduce((sum, venta) => sum + Number(venta.cantidad), 0) : 0;
      
      // Calculate revenue
      const revenue = ventas ? ventas.reduce((sum, venta) => sum + Number(venta.subtotal), 0) : 0;
      
      // Calculate margin percentage
      const costPrice = Number(producto.precio_compra);
      const salePrice = Number(producto.precio_venta);
      let margin = 0;
      
      if (costPrice > 0 && salePrice > costPrice) {
        margin = Math.round(((salePrice - costPrice) / salePrice) * 100);
      }
      
      result.push({
        name: producto.nombre,
        sales,
        margin,
        revenue
      });
    }
    
    // Return top 10 by revenue
    return result
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
      
  } catch (error) {
    console.error('Error in fetchProductProfitability:', error);
    return [];
  }
}

// Generate product popularity data
export async function fetchProductsByPopularity(): Promise<ProductPopularity[]> {
  try {
    // Get total sales by product
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre');
      
    if (productosError) {
      console.error('Error fetching productos:', productosError);
      return [];
    }
    
    const result: ProductPopularity[] = [];
    
    for (const producto of (productos || [])) {
      const { data: ventas, error: ventasError } = await supabase
        .from('detalles_venta')
        .select('cantidad')
        .eq('producto_id', producto.id);
        
      if (ventasError) {
        console.error('Error fetching ventas:', ventasError);
        continue;
      }
      
      // Calculate total units sold
      const totalSales = ventas ? ventas.reduce((sum, venta) => sum + Number(venta.cantidad), 0) : 0;
      
      if (totalSales > 0) {
        result.push({
          name: producto.nombre,
          sales: totalSales
        });
      }
    }
    
    // Return top 8 most popular products by quantity sold
    return result
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);
      
  } catch (error) {
    console.error('Error in fetchProductsByPopularity:', error);
    return [];
  }
}

// New function to fetch top selling products for the Dashboard component
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
