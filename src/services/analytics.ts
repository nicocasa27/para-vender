
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

// Fetch sales data by category
export async function fetchSalesByCategory(): Promise<SalesByCategory[]> {
  try {
    const { data: categorias, error: categoriasError } = await supabase
      .from('categorias')
      .select('id, nombre');

    if (categoriasError) {
      console.error('Error fetching categorias:', categoriasError);
      return [];
    }

    const salesByCategory: SalesByCategory[] = [];
    
    // For each category, calculate percentage based on number of products
    for (const categoria of categorias) {
      const { data: productos, error: productosError } = await supabase
        .from('productos')
        .select('id')
        .eq('categoria_id', categoria.id);
      
      if (productosError) {
        console.error('Error fetching productos:', productosError);
        continue;
      }

      // Add to results if products exist
      if (productos.length > 0) {
        salesByCategory.push({
          name: categoria.nombre,
          value: productos.length * 5 // Simulating sales data based on product count
        });
      }
    }

    // Calculate percentages
    const total = salesByCategory.reduce((sum, item) => sum + item.value, 0);
    return salesByCategory.map(item => ({
      ...item,
      value: Math.round((item.value / total) * 100)
    }));
  } catch (error) {
    console.error('Error in fetchSalesByCategory:', error);
    return [];
  }
}

// Fetch store performance data
export async function fetchStorePerformance(): Promise<SalesByStore[]> {
  try {
    const { data: almacenes, error: almacenesError } = await supabase
      .from('almacenes')
      .select('id, nombre');

    if (almacenesError) {
      console.error('Error fetching almacenes:', almacenesError);
      return [];
    }

    const storePerformance: SalesByStore[] = [];
    
    // For each store, calculate "sales" and "profit" based on inventory levels
    for (const almacen of almacenes) {
      const { data: inventario, error: inventarioError } = await supabase
        .from('inventario')
        .select('cantidad, producto_id, productos(precio_venta, precio_compra)')
        .eq('almacen_id', almacen.id);
      
      if (inventarioError) {
        console.error('Error fetching inventario:', inventarioError);
        continue;
      }

      // Calculate total sales and profit based on inventory and prices
      let sales = 0;
      let profit = 0;

      inventario.forEach(item => {
        if (item.productos) {
          const producto = item.productos as any;
          const itemSales = item.cantidad * producto.precio_venta;
          const itemProfit = item.cantidad * (producto.precio_venta - producto.precio_compra);
          
          sales += itemSales;
          profit += itemProfit;
        }
      });

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

// Helper function to get the last n months including the current one
function getRecentMonths(numberOfMonths: number = 12): string[] {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-based index (0 = January)
  
  const recentMonths: string[] = [];
  
  // Start from the current month and go back numberOfMonths-1 times
  for (let i = 0; i < numberOfMonths; i++) {
    // Calculate the month index (handle wrapping around to previous year)
    const monthIndex = (currentMonth - i + 12) % 12;
    recentMonths.unshift(months[monthIndex]); // Add to the beginning of the array
  }
  
  return recentMonths;
}

// Generate sales trend data based on existing inventory and prices, using current months
export async function fetchSalesTrend(): Promise<SalesData[]> {
  try {
    // Get the total inventory value across all stores
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, precio_venta, precio_compra');

    if (productosError) {
      console.error('Error fetching productos:', productosError);
      return [];
    }

    // Get total inventory quantities
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario')
      .select('producto_id, cantidad');

    if (inventarioError) {
      console.error('Error fetching inventario:', inventarioError);
      return [];
    }

    // Create a map of product ID to inventory quantities
    const productInventory: Record<string, number> = {};
    inventario.forEach(item => {
      if (productInventory[item.producto_id]) {
        productInventory[item.producto_id] += item.cantidad;
      } else {
        productInventory[item.producto_id] = item.cantidad;
      }
    });

    // Calculate total potential revenue and profit
    let totalRevenue = 0;
    let totalProfit = 0;

    productos.forEach(producto => {
      const cantidad = productInventory[producto.id] || 0;
      totalRevenue += producto.precio_venta * cantidad;
      totalProfit += (producto.precio_venta - producto.precio_compra) * cantidad;
    });

    // Get recent months (last 12 months including current)
    const recentMonths = getRecentMonths(12);
    const salesData: SalesData[] = [];

    // Generate data with realistic variations
    recentMonths.forEach((month, index) => {
      // Create some variation using the month index (seasonal patterns)
      const seasonalFactor = 1 + Math.sin((index / 12) * Math.PI * 2) * 0.3;
      const randomFactor = 0.85 + Math.random() * 0.3; // Random variation of ±15%
      
      const monthRevenue = Math.round((totalRevenue / 12) * seasonalFactor * randomFactor);
      const monthProfit = Math.round((totalProfit / 12) * seasonalFactor * randomFactor);

      salesData.push({
        date: month,
        revenue: monthRevenue,
        profit: monthProfit
      });
    });

    return salesData;
  } catch (error) {
    console.error('Error in fetchSalesTrend:', error);
    return [];
  }
}

// Fetch inventory levels using recent weeks
export async function fetchInventoryLevels(): Promise<InventoryData[]> {
  try {
    // Get current total inventory level
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario')
      .select('cantidad');

    if (inventarioError) {
      console.error('Error fetching inventario:', inventarioError);
      return [];
    }

    // Calculate total inventory
    const totalInventory = inventario.reduce((sum, item) => sum + item.cantidad, 0);
    
    // Generate 12 weeks of data with realistic variations, starting from current week
    const inventoryData: InventoryData[] = [];
    const currentDate = new Date();
    const currentWeek = Math.ceil((currentDate.getDate() + 6) / 7); // Get current week of month
    
    for (let i = 0; i < 12; i++) {
      // Calculate week number, with wrapping
      const weekNumber = ((currentWeek - i) + 52) % 52 || 52;
      
      // Create some variation with a slight downward trend followed by restocking
      let factor = 1;
      
      if (i <= 6) {
        // Decrease over first 6 weeks
        factor = 1 - (i / 20);
      } else if (i === 7) {
        // Restock at week 7
        factor = 1.1;
      } else {
        // Decrease again
        factor = 1.1 - ((i - 7) / 20);
      }
      
      // Add some random variation
      const randomFactor = 0.95 + Math.random() * 0.1;
      
      // Calculate the inventory level for this week
      const level = Math.round((totalInventory / 12) * factor * randomFactor);
      
      inventoryData.unshift({
        date: `Semana ${weekNumber}`,
        level
      });
    }

    return inventoryData;
  } catch (error) {
    console.error('Error in fetchInventoryLevels:', error);
    return [];
  }
}
