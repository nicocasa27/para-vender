
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
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoadingStores || stores.length === 0) return;

    const storeIds = stores.map(store => store.id);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Como las tablas no existen aún, simulamos datos o usamos fallbacks
        // En producción, estas consultas se harían a tablas reales
        
        // Simulación de ventas por categoría 
        try {
          const { data: catData, error: catError } = await supabase
            .rpc('get_ventas_por_categoria', { store_ids: storeIds });
            
          if (catError) throw catError;
          setSalesByCategory(catData || []);
        } catch (catErr) {
          console.error("Error cargando ventas por categoría:", catErr);
          setSalesByCategory([]);
        }

        // Simulación de top productos
        try {
          const { data: topData, error: topError } = await supabase
            .rpc('get_top_productos', { store_ids: storeIds });
            
          if (topError) throw topError;
          setTopProducts(topData || []);
        } catch (topErr) {
          console.error("Error cargando top productos:", topErr);
          setTopProducts([]);
        }

        // Simulación de ventas diarias
        try {
          const { data: revData, error: revError } = await supabase
            .rpc('get_ventas_por_dia', { store_ids: storeIds });
            
          if (revError) throw revError;
          setRevenueOverTime(revData || []);
        } catch (revErr) {
          console.error("Error cargando ventas diarias:", revErr);
          setRevenueOverTime([]);
        }
        
      } catch (err) {
        console.error("Error cargando analíticas:", err);
        toast.error("Error al cargar los datos analíticos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stores, isLoadingStores]);

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
