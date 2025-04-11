
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesChart } from "@/components/dashboard";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesDataPoint, ItemSalesTrendDataPoint } from "@/types/analytics";
import { toast } from "sonner";
import { ItemSalesTrendChart } from "@/components/analytics/ItemSalesTrendChart";
import { fetchItemSalesTrend } from "@/services/analyticService";

export default function Analytics() {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [revenueOverTime, setRevenueOverTime] = useState<SalesDataPoint[]>([]);
  const [itemSalesTrend, setItemSalesTrend] = useState<ItemSalesTrendDataPoint[]>([]);
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
      // Ventas por día
      const { data: salesTimeData, error: salesTimeError } = await supabase.rpc(
        "get_ventas_por_dia",
        { store_ids: storeIds }
      );
      
      if (salesTimeError) throw salesTimeError;
      setRevenueOverTime(salesTimeData || []);
      
      // Tendencia de ventas por ítem
      const itemTrendData = await fetchItemSalesTrend(storeIds, period);
      setItemSalesTrend(itemTrendData);
      
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
      
      {/* SalesChart */}
      <SalesChart storeIds={selectedStoreIds} />

      {/* Tendencia de ventas por ítem */}
      <ItemSalesTrendChart data={itemSalesTrend} loading={loading} />
      
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
