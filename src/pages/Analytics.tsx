import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { storeIds, isLoading: isLoadingStores } = useCurrentStores();
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoadingStores || storeIds.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Ventas por categoría
        const { data: catData, error: catError } = await supabase
          .from("ventas_por_categoria")
          .select("*")
          .in("almacen_id", storeIds);

        if (catError) throw catError;
        setSalesByCategory(catData || []);

        // Top productos vendidos
        const { data: topData, error: topError } = await supabase
          .from("ventas_top_productos")
          .select("*")
          .in("almacen_id", storeIds);

        if (topError) throw topError;
        setTopProducts(topData || []);

        // Ventas por día
        const { data: revData, error: revError } = await supabase
          .from("ventas_por_dia")
          .select("*")
          .in("almacen_id", storeIds);

        if (revError) throw revError;
        setRevenueOverTime(revData || []);
      } catch (err) {
        console.error("Error cargando analíticas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeIds, isLoadingStores]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Analíticas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <CardTitle>Top Productos</CardTitle>
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

      <Card>
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
    </div>
  );
}
