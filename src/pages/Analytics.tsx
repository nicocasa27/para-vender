
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Analytics() {
  const { stores, isLoading: isLoadingStores } = useCurrentStores();
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueOverTime, setRevenueOverTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener IDs de almacenes
  const storeIds = stores.map(store => store.id);

  useEffect(() => {
    if (isLoadingStores || storeIds.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Ventas por categoría
        const { data: catData, error: catError } = await supabase
          .rpc("ventas_por_categoria", { store_ids: storeIds })
          .select();
          
        if (catError) throw catError;
        setSalesByCategory(catData || []);

        // Top productos vendidos
        const { data: topData, error: topError } = await supabase
          .rpc("ventas_top_productos", { store_ids: storeIds })
          .select();
          
        if (topError) throw topError;
        setTopProducts(topData || []);

        // Ventas por día
        const { data: revData, error: revError } = await supabase
          .rpc("ventas_por_dia", { store_ids: storeIds })
          .select();
          
        if (revError) throw revError;
        setRevenueOverTime(revData || []);
      } catch (err: any) {
        console.error("Error cargando analíticas:", err);
        toast.error("Error al cargar datos analíticos", { 
          description: err.message 
        });
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
