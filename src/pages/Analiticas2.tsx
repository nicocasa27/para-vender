
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BarChart3Icon, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react";

// Importar gráficos específicos
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesByHourChart } from "@/components/analytics/SalesByHourChart";
import { LowStockTable } from "@/components/analytics/LowStockTable";

// Interfaces
interface SalesDataPoint {
  fecha: string;
  total: number;
}

interface CategoryDataPoint {
  categoria: string;
  total: number;
}

interface ProductDataPoint {
  producto: string;
  total: number;
}

interface TopSellingProduct {
  name: string;
  value: number;
}

const Analiticas2 = () => {
  const { stores, isLoading: storesLoading } = useCurrentStores();
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
        // Consulta directa a Supabase
        const now = new Date();
        let startDate = new Date();
        
        switch(timeRange) {
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
        
        let query = supabase
          .from('detalles_venta')
          .select(`
            cantidad,
            precio_unitario,
            productos:producto_id(id, nombre),
            ventas:venta_id(created_at, almacen_id)
          `)
          .gte('ventas.created_at', startDate.toISOString())
          .lte('ventas.created_at', now.toISOString());
        
        if (selectedStore) {
          query = query.eq('ventas.almacen_id', selectedStore);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Agrupar y sumar ventas por producto
        const productSales: Record<string, { name: string, value: number }> = {};
        
        data?.forEach(item => {
          if (!item.productos?.nombre) return;
          
          const productName = item.productos.nombre;
          const productId = item.productos.id;
          const amount = Number(item.cantidad) * Number(item.precio_unitario);
          
          const key = `${productId}`;
          if (!productSales[key]) {
            productSales[key] = {
              name: productName,
              value: 0
            };
          }
          
          productSales[key].value += amount;
        });
        
        // Convertir a array y ordenar por valor
        const topProductsArray = Object.values(productSales)
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
          .map(item => ({
            producto: item.name,
            total: Number(item.value.toFixed(1))
          }));
        
        return topProductsArray;
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
        
        switch(timeRange) {
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
        
        // Primero obtenemos los productos con sus categorías
        const { data: products, error: prodError } = await supabase
          .from('productos')
          .select(`
            id,
            nombre,
            categoria_id,
            categorias:categoria_id(id, nombre)
          `);
          
        if (prodError) throw prodError;
        
        // Creamos un mapa de productos a categorías
        const productToCategory: Record<string, { id: string, name: string }> = {};
        products?.forEach(product => {
          if (product.categorias) {
            productToCategory[product.id] = { 
              id: product.categoria_id, 
              name: product.categorias.nombre 
            };
          }
        });
        
        // Ahora obtenemos las ventas en el período seleccionado
        let salesQuery = supabase
          .from('detalles_venta')
          .select(`
            producto_id,
            subtotal,
            ventas:venta_id(almacen_id, created_at)
          `)
          .gte('ventas.created_at', startDate.toISOString())
          .lte('ventas.created_at', now.toISOString());
          
        if (selectedStore) {
          salesQuery = salesQuery.eq('ventas.almacen_id', selectedStore);
        }
        
        const { data: salesData, error: salesError } = await salesQuery;
        
        if (salesError) throw salesError;
        
        // Agrupar por categoría
        const categoryTotals: Record<string, { name: string, total: number }> = {};
        
        salesData?.forEach(item => {
          if (!item.producto_id || !productToCategory[item.producto_id]) return;
          
          const category = productToCategory[item.producto_id];
          const amount = Number(item.subtotal) || 0;
          
          if (!categoryTotals[category.id]) {
            categoryTotals[category.id] = { name: category.name, total: 0 };
          }
          
          categoryTotals[category.id].total += amount;
        });
        
        // Formatear para gráfico
        return Object.values(categoryTotals).map(({ name, total }) => ({
          categoria: name,
          total: Number(total.toFixed(1))
        }));
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
        let interval = 'day';
        
        switch(timeRange) {
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
          let dateKey;
          
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
        }));
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
          <p className="text-muted-foreground">
            Vista optimizada de indicadores clave del negocio
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshAllData}
          disabled={topProductsLoading || categorySalesLoading || revenueLoading}
        >
          {topProductsLoading || categorySalesLoading || revenueLoading ? (
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
                  Tendencia de ventas para {timeRange === 'week' ? 'la última semana' : timeRange === 'month' ? 'el último mes' : 'el último año'}
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
