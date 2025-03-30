
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";

export default function Analytics() {
  const { stores, hasStores } = useCurrentStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days">("30days");
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueOverTime, setRevenueOverTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Set initial selected store
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Load data when store or date range changes
  useEffect(() => {
    if (selectedStoreId) {
      loadAnalyticsData();
    }
  }, [selectedStoreId, dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Create an array with the selected store ID
      const storeIds = [selectedStoreId];
      
      // Load sales by category data
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('get_ventas_por_categoria', { store_ids: storeIds });
        
      if (categoryError) throw categoryError;
      setSalesByCategory(categoryData || []);
      
      // Load top products data
      const { data: productsData, error: productsError } = await supabase
        .rpc('get_top_productos', { store_ids: storeIds });
        
      if (productsError) throw productsError;
      setTopProducts(productsData || []);
      
      // Load sales over time data
      const { data: timeData, error: timeError } = await supabase
        .rpc('get_ventas_por_dia', { store_ids: storeIds });
        
      if (timeError) throw timeError;
      setRevenueOverTime(timeData || []);
      
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Análisis de Ventas</h2>
            <p className="text-muted-foreground">
              Analiza el rendimiento de ventas, productos populares y tendencias.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <Select
                value={selectedStoreId}
                onValueChange={setSelectedStoreId}
                disabled={!hasStores}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tienda" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Select
                value={dateRange}
                onValueChange={(value: any) => setDateRange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Últimos 7 días</SelectItem>
                  <SelectItem value="30days">Últimos 30 días</SelectItem>
                  <SelectItem value="90days">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesByCategoryChart data={salesByCategory} loading={loading} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <TopProductsChart data={topProducts} loading={loading} />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Ingresos en el Tiempo</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueOverTimeChart data={revenueOverTime} loading={loading} />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
