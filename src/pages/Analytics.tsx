
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RevenueOverTimeChart from "@/components/analytics/RevenueOverTimeChart";
import SalesByCategoryChart from "@/components/analytics/SalesByCategoryChart";
import TopProductsChart from "@/components/analytics/TopProductsChart";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { supabase } from "@/integrations/supabase/client";
import { ChartProps } from "@/types/analytics";

const Analytics = () => {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [storeIds, setStoreIds] = useState<string[]>([]);
  
  const [salesOverTime, setSalesOverTime] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stores && stores.length > 0) {
      setStoreIds(stores.map(store => store.id));
    }
  }, [stores]);
  
  useEffect(() => {
    if (storeIds.length === 0) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch sales over time
        const { data: timeData, error: timeError } = await supabase
          .rpc('get_ventas_por_dia', { store_ids: storeIds });
          
        if (timeError) throw timeError;
        setSalesOverTime(timeData || []);
        
        // Fetch sales by category
        const { data: categoryData, error: categoryError } = await supabase
          .rpc('get_ventas_por_categoria', { store_ids: storeIds });
          
        if (categoryError) throw categoryError;
        setSalesByCategory(categoryData || []);
        
        // Fetch top products
        const { data: productsData, error: productsError } = await supabase
          .rpc('get_top_productos', { store_ids: storeIds });
          
        if (productsError) throw productsError;
        setTopProducts(productsData || []);
        
      } catch (error) {
        console.error("Error al cargar datos analíticos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [storeIds]);
  
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analíticas</h2>
          <p className="text-muted-foreground mt-2">
            Analice las ventas y el rendimiento de su negocio.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="col-span-3 lg:col-span-3">
            <CardHeader>
              <CardTitle>Ingresos a lo largo del tiempo</CardTitle>
              <CardDescription>
                Visualización de ingresos diarios durante el último mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueOverTimeChart data={salesOverTime} />
            </CardContent>
          </Card>

          <Card className="col-span-3 lg:col-span-2">
            <CardHeader>
              <CardTitle>Ventas por Categoría</CardTitle>
              <CardDescription>
                Distribución de ventas por categoría de producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesByCategoryChart data={salesByCategory} />
            </CardContent>
          </Card>

          <Card className="col-span-3 lg:col-span-1">
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>
                Los 10 productos con mayor volumen de venta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsChart data={topProducts} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
