
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";

export default function Analytics() {
  const { stores, isLoading: isLoadingStores } = useCurrentStores();
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueOverTime, setRevenueOverTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const storeIds = stores.map(store => store.id);

  useEffect(() => {
    if (isLoadingStores || storeIds.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Ventas por categoría - using direct table query instead of RPC
        const { data: catData, error: catError } = await supabase
          .from("categorias")
          .select(`
            id,
            nombre,
            ventas:productos!inner(
              id,
              categoria_id,
              ventas:detalles_venta!inner(
                subtotal
              )
            )
          `);
        
        if (catError) throw catError;
        
        // Process the data into the format needed for the chart
        const processedCatData = catData?.map(cat => ({
          category: cat.nombre,
          value: cat.ventas.reduce((sum: number, prod: any) => 
            sum + prod.ventas.reduce((s: number, v: any) => s + v.subtotal, 0), 0)
        })) || [];
        
        setSalesByCategory(processedCatData);

        // Top productos (most sold)
        const { data: topData, error: topError } = await supabase
          .from("productos")
          .select(`
            id,
            nombre,
            ventas:detalles_venta(
              cantidad,
              subtotal
            )
          `)
          .order("nombre");
        
        if (topError) throw topError;
        
        // Process for top products
        const processedTopData = topData?.map(prod => ({
          name: prod.nombre,
          value: prod.ventas.reduce((sum: number, v: any) => sum + v.cantidad, 0)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) || [];
        
        setTopProducts(processedTopData);

        // Revenue over time
        const { data: revData, error: revError } = await supabase
          .from("ventas")
          .select("created_at, total")
          .order("created_at");
        
        if (revError) throw revError;
        
        // Group by date and sum totals
        const dateMap: Record<string, number> = {};
        revData?.forEach((sale: any) => {
          const date = new Date(sale.created_at).toLocaleDateString();
          dateMap[date] = (dateMap[date] || 0) + Number(sale.total);
        });
        
        const processedRevData = Object.entries(dateMap).map(([date, value]) => ({
          date,
          value
        }));
        
        setRevenueOverTime(processedRevData);
      } catch (err) {
        console.error("Error cargando analíticas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeIds, isLoadingStores]);

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in p-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-md" />
            ) : (
              <RevenueOverTimeChart data={revenueOverTime} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full rounded-md" />
            ) : (
              <SalesByCategoryChart data={salesByCategory} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full rounded-md" />
            ) : (
              <TopProductsChart data={topProducts} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
