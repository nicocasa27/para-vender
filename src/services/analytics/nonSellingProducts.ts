
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NonSellingProductDataPoint } from "@/types/analytics";
import { calculateDateRange, handleAnalyticsError } from "./utils";

export async function fetchNonSellingProducts(storeIds: string[] = [], timeRange: string = "month"): Promise<NonSellingProductDataPoint[]> {
  try {
    if (!storeIds || storeIds.length === 0) {
      console.log("No se proporcionaron tiendas para la consulta de productos sin ventas");
      return [];
    }

    const { startDate, endDate } = calculateDateRange(timeRange);
    
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
          ventas!inner(id, created_at, almacen_id)
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
      
      // Fixed: Access created_at from the correct path
      const lastSaleDate = lastSale[0] && lastSale[0].ventas 
        ? new Date(lastSale[0].ventas.created_at) 
        : new Date(0);
      
      if (lastSaleDate < startDate) {
        const diasSinVenta = Math.floor((endDate.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
        
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
    
    return nonSellingProducts;
    
  } catch (error) {
    console.error('Error al obtener productos sin ventas:', error);
    toast.error('Error al cargar los datos de productos sin ventas');
    return [];
  }
}
