import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ItemSalesTrendDataPoint, StoreMonthlySalesDataPoint, TotalSalesByStoreDataPoint, NonSellingProductDataPoint } from "@/types/analytics";

export async function fetchItemSalesTrend(storeIds: string[] = [], timeRange: string = "month") {
  try {
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
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
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
    
    const processedData: ItemSalesTrendDataPoint[] = data.map(item => {
      const venta = item.ventas as any;
      const producto = item.productos as any;
      
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

export async function fetchTotalSalesByStore(storeIds: string[] = [], timeRange: string = "month") {
  try {
    if (!storeIds || storeIds.length === 0) {
      console.log("No se proporcionaron tiendas para la consulta de ventas totales");
      return [];
    }

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
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    console.log(`Obteniendo ventas totales desde ${startDateStr} hasta ${endDateStr} para tiendas:`, storeIds);
    
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, 
        total,
        almacen_id,
        almacenes(id, nombre)
      `)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .in('almacen_id', storeIds);
    
    if (error) {
      console.error("Error al obtener datos de ventas totales:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No hay datos de ventas disponibles para el período seleccionado");
      return [];
    }
    
    console.log(`Se encontraron ${data.length} registros de ventas totales`);
    
    const storeData: Record<string, { id: string, nombre: string, total: number }> = {};
    
    data.forEach(sale => {
      const storeId = sale.almacen_id;
      const storeName = (sale.almacenes as any)?.nombre || 'Tienda desconocida';
      
      if (!storeData[storeId]) {
        storeData[storeId] = {
          id: storeId,
          nombre: storeName,
          total: 0
        };
      }
      
      storeData[storeId].total += Number(sale.total);
    });
    
    const chartData: TotalSalesByStoreDataPoint[] = Object.values(storeData);
    
    chartData.sort((a, b) => b.total - a.total);
    
    console.log("Datos procesados para el gráfico de ventas totales:", chartData);
    return chartData;
    
  } catch (error) {
    console.error('Error al obtener ventas totales por sucursal:', error);
    toast.error('Error al cargar los datos de ventas totales');
    return [];
  }
}

export async function fetchNonSellingProducts(storeIds: string[] = [], timeRange: string = "month") {
  try {
    if (!storeIds || storeIds.length === 0) {
      console.log("No se proporcionaron tiendas para la consulta de productos sin ventas");
      return [];
    }

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
    
    const startDateStr = startDate.toISOString();
    
    console.log(`Buscando productos sin ventas desde ${startDateStr} para tiendas:`, storeIds);
    
    const { data: inventoryProducts, error: inventoryError } = await supabase
      .from('inventario')
      .select(`
        producto_id,
        productos(id, nombre)
      `)
      .in('almacen_id', storeIds)
      .gt('cantidad', 0);
    
    if (inventoryError) {
      console.error("Error al obtener productos en inventario:", inventoryError);
      throw inventoryError;
    }
    
    if (!inventoryProducts || inventoryProducts.length === 0) {
      console.log("No hay productos en inventario para las tiendas seleccionadas");
      return [];
    }
    
    const productIds = [...new Set(inventoryProducts
      .map(item => item.producto_id)
      .filter(id => id !== null))];
    
    console.log(`Se encontraron ${productIds.length} productos únicos en inventario`);
    
    const nonSellingProducts: NonSellingProductDataPoint[] = [];
    
    for (const productId of productIds) {
      const { data: lastSale, error: saleError } = await supabase
        .from('detalles_venta')
        .select(`
          id,
          created_at,
          producto_id,
          productos(id, nombre),
          ventas(id, created_at, almacen_id)
        `)
        .eq('producto_id', productId)
        .in('ventas.almacen_id', storeIds)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (saleError) {
        console.error(`Error al buscar ventas para el producto ${productId}:`, saleError);
        continue;
      }
      
      const producto = inventoryProducts.find(p => p.producto_id === productId)?.productos as any;
      
      if (!producto) {
        console.log(`Producto ${productId} no encontrado en los datos de inventario`);
        continue;
      }
      
      const nombreProducto = producto.nombre;
      
      if (!lastSale || lastSale.length === 0) {
        nonSellingProducts.push({
          id: productId,
          nombre: nombreProducto,
          dias_sin_venta: 999,
          ultima_venta: null
        });
        continue;
      }
      
      const lastSaleDate = new Date(lastSale[0].ventas.created_at);
      
      if (lastSaleDate < startDate) {
        const diasSinVenta = Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
        
        nonSellingProducts.push({
          id: productId,
          nombre: nombreProducto,
          dias_sin_venta: diasSinVenta,
          ultima_venta: lastSaleDate.toISOString()
        });
      }
    }
    
    nonSellingProducts.sort((a, b) => b.dias_sin_venta - a.dias_sin_venta);
    
    console.log(`Se encontraron ${nonSellingProducts.length} productos sin ventas en el período seleccionado`);
    console.log("Datos procesados para el gráfico de productos sin venta:", nonSellingProducts);
    
    return nonSellingProducts;
    
  } catch (error) {
    console.error('Error al obtener productos sin ventas:', error);
    toast.error('Error al cargar los datos de productos sin ventas');
    return [];
  }
}
