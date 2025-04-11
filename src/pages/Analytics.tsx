import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStores } from "@/hooks/useStores";
import { useQuery } from "@tanstack/react-query";
import { fetchTopSellingProducts } from "@/services/analyticService";
import { supabase } from "@/integrations/supabase/client";

// Importar gráficos específicos
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesByHourChart } from "@/components/analytics/SalesByHourChart";
import { LowStockTable } from "@/components/analytics/LowStockTable";

const Analytics = () => {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ventas");
  const [timeRange, setTimeRange] = useState("week");
  const { stores, isLoading: storesLoading } = useStores();
  
  const { data: topProducts, isLoading: topProductsLoading } = useQuery({
    queryKey: ['topProducts', selectedStore],
    queryFn: () => fetchTopSellingProducts(selectedStore),
    enabled: activeTab === 'productos',
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  
  const handleStoreChange = (value: string) => {
    setSelectedStore(value === "all" ? null : value);
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Análisis</h1>
        <p className="text-muted-foreground">
          Visualice las métricas clave de su negocio.
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Select onValueChange={handleStoreChange} defaultValue="all">
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Seleccione una sucursal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {storesLoading ? (
              <SelectItem value="loading" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </SelectItem>
            ) : (
              stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <Select onValueChange={setTimeRange} defaultValue="week">
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Seleccione un período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
            <SelectItem value="year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="ventas" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ventas" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Totales</CardTitle>
              <CardDescription>
                Visualización de ingresos a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <RevenueOverTimeChart storeId={selectedStore} period={timeRange} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Categoría</CardTitle>
              <CardDescription>
                Distribución de ventas por categoría de producto
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <SalesByCategoryChart storeId={selectedStore} period={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="productos" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>
                Top 5 productos con mayor cantidad de ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {topProductsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando productos...
                </div>
              ) : (
                <TopProductsChart data={topProducts || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos con Stock Crítico</CardTitle>
              <CardDescription>
                Productos que necesitan ser reabastecidos
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
              <SalesByHourChart 
                storeId={selectedStore}
                period={timeRange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
