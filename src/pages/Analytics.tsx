
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesChart } from "@/components/dashboard";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesDataPoint, CategoryDataPoint, ProductDataPoint } from "@/types/analytics";
import { toast } from "sonner";

export default function Analytics() {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [salesByCategory, setSalesByCategory] = useState<CategoryDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductDataPoint[]>([]);
  const [revenueOverTime, setRevenueOverTime] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelectedStoreIds(stores.map(store => store.id));
    }
  }, [stores]);

  const fetchAnalytics = async (period = "week") => {
    if (!stores || stores.length === 0) return;
    
    const storeIds = stores.map(store => store.id);
    setLoading(true);
    
    try {
      // Ventas por categoría
      const { data: salesCategoryData, error: salesCategoryError } = await supabase.rpc(
        "get_ventas_por_categoria",
        { store_ids: storeIds }
      );
      
      if (salesCategoryError) throw salesCategoryError;
      setSalesByCategory(salesCategoryData || []);
      
      // Productos más vendidos
      const { data: topProductsData, error: topProductsError } = await supabase.rpc(
        "get_top_productos",
        { store_ids: storeIds }
      );
      
      if (topProductsError) throw topProductsError;
      setTopProducts(topProductsData || []);
      
      // Ventas por día
      const { data: salesTimeData, error: salesTimeError } = await supabase.rpc(
        "get_ventas_por_dia",
        { store_ids: storeIds }
      );
      
      if (salesTimeError) throw salesTimeError;
      setRevenueOverTime(salesTimeData || []);
      
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Error al cargar los datos analíticos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingStores && stores.length > 0) {
      fetchAnalytics(dateRange);
    }
  }, [stores, loadingStores, dateRange]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Analíticas</h2>
        <p className="text-muted-foreground">
          Visualiza el rendimiento de ventas e inventario
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-medium">Resumen de Ventas</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            onClick={() => {
              setDateRange("week");
              fetchAnalytics("week");
            }}
            size="sm"
          >
            Semana
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => {
              setDateRange("month");
              fetchAnalytics("month");
            }}
            size="sm"
          >
            Mes
          </Button>
          <Button
            variant={dateRange === "year" ? "default" : "outline"}
            onClick={() => {
              setDateRange("year");
              fetchAnalytics("year");
            }}
            size="sm"
          >
            Año
          </Button>
        </div>
      </div>
      
      {/* Added SalesChart here, moved from dashboard */}
      <SalesChart storeIds={selectedStoreIds} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CardTitle>Top Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={topProducts} loading={loading} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueOverTimeChart data={revenueOverTime} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
