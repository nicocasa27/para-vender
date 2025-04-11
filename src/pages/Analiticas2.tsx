
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStores } from "@/hooks/useStores";
import { useQuery } from "@tanstack/react-query";
import { fetchTopSellingProducts } from "@/services/analyticService";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Importar gráficos específicos
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesByHourChart } from "@/components/analytics/SalesByHourChart";
import { LowStockTable } from "@/components/analytics/LowStockTable";

// Tipos
import { ProductDataPoint, CategoryDataPoint, SalesDataPoint } from "@/types/analytics";

const Analiticas2 = () => {
  const { stores, isLoading: storesLoading } = useStores();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("month");
  const [activeTab, setActiveTab] = useState("ventas");

  // Seleccionar la primera tienda por defecto cuando cargan
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);

  // Consulta para productos más vendidos
  const { data: topProducts, isLoading: topProductsLoading, refetch: refetchTopProducts } = useQuery({
    queryKey: ['topProducts', selectedStore, timeRange],
    queryFn: async () => {
      try {
        const timeRangeMap: Record<string, "daily" | "weekly" | "monthly"> = {
          "week": "weekly",
          "month": "monthly",
          "year": "monthly"
        };
        
        const data = await fetchTopSellingProducts(
          timeRangeMap[timeRange] || "monthly", 
          selectedStore ? [selectedStore] : null
        );
        
        // Formatear para TopProductsChart
        return data.map(item => ({
          producto: item.name,
          total: item.value
        })) as ProductDataPoint[];
      } catch (error) {
        console.error("Error cargando productos top:", error);
        return [];
      }
    },
    enabled: !!selectedStore
  });

  // Consulta para ventas por categoría
  const { data: categorySales, isLoading: categorySalesLoading, refetch: refetchCategorySales } = useQuery({
    queryKey: ['categorySales', selectedStore, timeRange],
    queryFn: async () => {
      try {
        // Determinar el rango de fechas
        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        // Simplificar la consulta para evitar errores de parsing
        let query = supabase
          .from('detalles_venta')
          .select(`
            subtotal,
            producto_id,
            venta_id
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());
          
        if (selectedStore) {
          // Primero obtener ventas para el almacén seleccionado
          const { data: ventas, error: ventasError } = await supabase
            .from('ventas')
            .select('id')
            .eq('almacen_id', selectedStore)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', now.toISOString());
            
          if (ventasError) throw ventasError;
          
          if (ventas && ventas.length > 0) {
            const ventaIds = ventas.map(v => v.id);
            query = query.in('venta_id', ventaIds);
          } else {
            return []; // No hay ventas para este almacén en este período
          }
        }
        
        const { data: detalles, error: detallesError } = await query;
        if (detallesError) throw detallesError;
        
        if (!detalles || detalles.length === 0) {
          return [];
        }
        
        // Obtener detalles de productos para conseguir las categorías
        const productoIds = [...new Set(detalles.map(d => d.producto_id))];
        
        const { data: productos, error: productosError } = await supabase
          .from('productos')
          .select(`
            id,
            categoria_id
          `)
          .in('id', productoIds);
          
        if (productosError) throw productosError;
        
        // Mapear productos a categorías
        const productoCategoriaMap: Record<string, string> = {};
        productos?.forEach(p => {
          if (p.id && p.categoria_id) {
            productoCategoriaMap[p.id] = p.categoria_id;
          }
        });
        
        // Obtener nombres de categorías
        const categoriaIds = [...new Set(Object.values(productoCategoriaMap))];
        
        const { data: categorias, error: categoriasError } = await supabase
          .from('categorias')
          .select('id, nombre')
          .in('id', categoriaIds);
          
        if (categoriasError) throw categoriasError;
        
        // Mapear IDs de categoría a nombres
        const categoriaNombreMap: Record<string, string> = {};
        categorias?.forEach(c => {
          if (c.id && c.nombre) {
            categoriaNombreMap[c.id] = c.nombre;
          }
        });
        
        // Agrupar ventas por categoría
        const categoryTotals: Record<string, number> = {};
        
        detalles.forEach(detalle => {
          const productoId = detalle.producto_id;
          const categoriaId = productoCategoriaMap[productoId];
          const categoriaNombre = categoriaNombreMap[categoriaId] || 'Sin categoría';
          const amount = Number(detalle.subtotal) || 0;
          
          if (!categoryTotals[categoriaNombre]) {
            categoryTotals[categoriaNombre] = 0;
          }
          
          categoryTotals[categoriaNombre] += amount;
        });
        
        // Formatear para gráfico
        return Object.entries(categoryTotals).map(([name, total]) => ({
          categoria: name,
          total: Number(total.toFixed(1))
        })) as CategoryDataPoint[];
      } catch (error) {
        console.error("Error cargando ventas por categoría:", error);
        return [];
      }
    },
    enabled: !!selectedStore
  });

  // Consulta para ingresos a lo largo del tiempo
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['revenue', selectedStore, timeRange],
    queryFn: async () => {
      try {
        // Determinar el rango de fechas
        const now = new Date();
        let startDate = new Date();
        let interval: 'day' | 'week' | 'month' = 'day';
        
        switch (timeRange) {
          case "week":
            startDate.setDate(now.getDate() - 7);
            interval = 'day';
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            interval = 'day';
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            interval = 'month';
            break;
        }

        let query = supabase
          .from('ventas')
          .select('id, total, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString())
          .order('created_at');
          
        if (selectedStore) {
          query = query.eq('almacen_id', selectedStore);
        }
          
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Agrupar por fecha según el intervalo
        const salesByDate: Record<string, number> = {};
        
        data?.forEach(sale => {
          const date = new Date(sale.created_at);
          let dateKey: string;
          
          if (interval === 'day') {
            dateKey = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          } else {
            dateKey = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
          }
          
          if (!salesByDate[dateKey]) {
            salesByDate[dateKey] = 0;
          }
          
          salesByDate[dateKey] += Number(sale.total) || 0;
        });
        
        // Formatear para gráfico
        return Object.entries(salesByDate).map(([date, total]) => ({
          fecha: date,
          total: Number(total.toFixed(1))
        })) as SalesDataPoint[];
      } catch (error) {
        console.error("Error cargando datos de ingresos:", error);
        return [];
      }
    },
    enabled: !!selectedStore
  });

  // Refrescar todos los datos
  const refreshAllData = () => {
    refetchTopProducts();
    refetchCategorySales();
    refetchRevenue();
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analíticas 2</h1>
          <p className="text-muted-foreground">Vista optimizada de indicadores clave del negocio</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshAllData}
          disabled={topProductsLoading || categorySalesLoading || revenueLoading}
        >
          {(topProductsLoading || categorySalesLoading || revenueLoading) ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar datos
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select 
            value={selectedStore || ''} 
            onValueChange={(value) => setSelectedStore(value)}
            disabled={storesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tienda" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Periodo de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="horarios">Por Hora</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ventas" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos a lo largo del tiempo</CardTitle>
                <CardDescription>
                  Tendencia de ventas para {timeRange === 'week' ? 'la última semana' : 
                                           timeRange === 'month' ? 'el último mes' : 'el último año'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueOverTimeChart data={revenueData || []} loading={revenueLoading} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ventas por categoría</CardTitle>
                <CardDescription>
                  Distribución de ventas por categoría de producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesByCategoryChart data={categorySales || []} loading={categorySalesLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="productos" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos más vendidos</CardTitle>
              <CardDescription>
                Top productos por unidades vendidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsChart data={topProducts || []} loading={topProductsLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventario" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos con stock crítico</CardTitle>
              <CardDescription>
                Productos bajo el nivel mínimo recomendado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LowStockTable storeId={selectedStore} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="horarios" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por hora del día</CardTitle>
              <CardDescription>
                Distribución de ventas a lo largo del día
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <SalesByHourChart storeId={selectedStore} period={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analiticas2;
