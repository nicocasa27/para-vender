import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isErrorObject, extractProperty } from "@/utils/supabaseHelpers";

export interface DashboardStats {
  ventasHoy: {
    total: number;
    porcentaje: number;
  };
  nuevosClientes: {
    total: number;
    porcentaje: number;
  };
  productosVendidos: {
    total: number;
    porcentaje: number;
  };
  transferencias: {
    total: number;
    porcentaje: number;
  };
  ventasTotales: {
    total: number;
  };
}

export const fetchDashboardStats = async (tenantId?: string): Promise<DashboardStats> => {
  try {
    // Get current tenant id from localStorage if not provided
    if (!tenantId) {
      tenantId = localStorage.getItem('currentTenantId');
      if (!tenantId) {
        throw new Error("No se ha seleccionado una organización");
      }
    }

    // Obtener fecha actual (hoy)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // Fecha de ayer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayStr = yesterday.toISOString();
    
    // Ventas de hoy
    const { data: ventasHoy, error: errorVentasHoy } = await supabase
      .from('ventas')
      .select('total')
      .eq('tenant_id', tenantId)
      .gte('created_at', todayStr);
    
    if (errorVentasHoy) {
      console.error('Error al obtener ventas de hoy:', errorVentasHoy);
      throw errorVentasHoy;
    }
    
    // Ventas de ayer
    const { data: ventasAyer, error: errorVentasAyer } = await supabase
      .from('ventas')
      .select('total')
      .eq('tenant_id', tenantId)
      .gte('created_at', yesterdayStr)
      .lt('created_at', todayStr);
    
    if (errorVentasAyer) {
      console.error('Error al obtener ventas de ayer:', errorVentasAyer);
      throw errorVentasAyer;
    }
    
    // Ventas totales (todas las que existen)
    const { data: ventasTotales, error: errorVentasTotales } = await supabase
      .from('ventas')
      .select('total')
      .eq('tenant_id', tenantId);
    
    if (errorVentasTotales) {
      console.error('Error al obtener ventas totales:', errorVentasTotales);
      throw errorVentasTotales;
    }
    
    // Calcular totales y porcentajes
    const totalVentasHoy = ventasHoy?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;
    const totalVentasAyer = ventasAyer?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 1; // Evitar división por cero
    const porcentajeVentas = Math.round(((totalVentasHoy - totalVentasAyer) / totalVentasAyer) * 100);
    
    // Total histórico de ventas
    const sumaVentasTotales = ventasTotales?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;
    
    // Clientes únicos hoy (basado en ventas con campo cliente no nulo)
    const { data: clientesHoy, error: errorClientesHoy } = await supabase
      .from('ventas')
      .select('user_id') // Use user_id instead of cliente which doesn't exist
      .eq('tenant_id', tenantId)
      .gte('created_at', todayStr)
      .not('user_id', 'is', null);
    
    if (errorClientesHoy) {
      console.error('Error al obtener clientes de hoy:', errorClientesHoy);
      throw errorClientesHoy;
    }
    
    // Clientes únicos ayer
    const { data: clientesAyer, error: errorClientesAyer } = await supabase
      .from('ventas')
      .select('user_id') // Use user_id instead of cliente which doesn't exist
      .eq('tenant_id', tenantId)
      .gte('created_at', yesterdayStr)
      .lt('created_at', todayStr)
      .not('user_id', 'is', null);
    
    if (errorClientesAyer) {
      console.error('Error al obtener clientes de ayer:', errorClientesAyer);
      throw errorClientesAyer;
    }
    
    // Eliminar duplicados para contar clientes únicos
    const clientesUnicosHoy = new Set(clientesHoy.map(c => c.user_id)).size;
    const clientesUnicosAyer = new Set(clientesAyer.map(c => c.user_id)).size || 1;
    const porcentajeClientes = Math.round(((clientesUnicosHoy - clientesUnicosAyer) / clientesUnicosAyer) * 100);
    
    // Productos vendidos hoy (cantidad total)
    const { data: detallesHoy, error: errorDetallesHoy } = await supabase
      .from('detalles_venta')
      .select('cantidad, ventas:venta_id(created_at)')
      .eq('tenant_id', tenantId)
      .gte('ventas.created_at', todayStr);
    
    if (errorDetallesHoy) {
      console.error('Error al obtener detalles de ventas de hoy:', errorDetallesHoy);
      throw errorDetallesHoy;
    }
    
    // Productos vendidos ayer
    const { data: detallesAyer, error: errorDetallesAyer } = await supabase
      .from('detalles_venta')
      .select('cantidad, ventas:venta_id(created_at)')
      .eq('tenant_id', tenantId)
      .gte('ventas.created_at', yesterdayStr)
      .lt('ventas.created_at', todayStr);
    
    if (errorDetallesAyer) {
      console.error('Error al obtener detalles de ventas de ayer:', errorDetallesAyer);
      throw errorDetallesAyer;
    }
    
    const totalProductosHoy = detallesHoy?.reduce((sum, detalle) => sum + (Number(detalle.cantidad) || 0), 0) || 0;
    const totalProductosAyer = detallesAyer?.reduce((sum, detalle) => sum + (Number(detalle.cantidad) || 0), 0) || 1;
    const porcentajeProductos = Math.round(((totalProductosHoy - totalProductosAyer) / totalProductosAyer) * 100);
    
    // Transferencias realizadas hoy
    const { data: transferenciasHoy, error: errorTransferenciasHoy } = await supabase
      .from('movimientos')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tipo', 'transferencia')
      .gte('created_at', todayStr);
    
    if (errorTransferenciasHoy) {
      console.error('Error al obtener transferencias de hoy:', errorTransferenciasHoy);
      throw errorTransferenciasHoy;
    }
    
    // Transferencias realizadas ayer
    const { data: transferenciasAyer, error: errorTransferenciasAyer } = await supabase
      .from('movimientos')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tipo', 'transferencia')
      .gte('created_at', yesterdayStr)
      .lt('created_at', todayStr);
    
    if (errorTransferenciasAyer) {
      console.error('Error al obtener transferencias de ayer:', errorTransferenciasAyer);
      throw errorTransferenciasAyer;
    }
    
    const totalTransferenciasHoy = transferenciasHoy?.length || 0;
    const totalTransferenciasAyer = transferenciasAyer?.length || 1;
    const porcentajeTransferencias = Math.round(((totalTransferenciasHoy - totalTransferenciasAyer) / totalTransferenciasAyer) * 100);
    
    return {
      ventasHoy: {
        total: Math.round(totalVentasHoy),
        porcentaje: porcentajeVentas
      },
      nuevosClientes: {
        total: clientesUnicosHoy,
        porcentaje: porcentajeClientes
      },
      productosVendidos: {
        total: totalProductosHoy,
        porcentaje: porcentajeProductos
      },
      transferencias: {
        total: totalTransferenciasHoy,
        porcentaje: porcentajeTransferencias
      },
      ventasTotales: {
        total: Math.round(sumaVentasTotales)
      }
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    toast.error("Error al cargar estadísticas del dashboard");
    
    // Devolver datos por defecto en caso de error
    return {
      ventasHoy: { total: 0, porcentaje: 0 },
      nuevosClientes: { total: 0, porcentaje: 0 },
      productosVendidos: { total: 0, porcentaje: 0 },
      transferencias: { total: 0, porcentaje: 0 },
      ventasTotales: { total: 0 }
    };
  }
};
