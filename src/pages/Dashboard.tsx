
import { useEffect, useState } from "react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { InventorySummary } from "@/components/dashboard/InventorySummary";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { supabase } from "@/integrations/supabase/client";
import { ActivitySquare, BarChart3, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { stores, isLoading: storesLoading } = useCurrentStores();
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
    salesGrowth: 0,
    recentSales: [],
    salesChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storesLoading || stores.length === 0) return;
    
    const storeIds = stores.map(store => store.id);
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Ejemplo de carga de datos para el dashboard
        // Estas consultas se deberían adaptar según tu estructura de base de datos
        
        // Para simplificar, usamos data dummies cuando no podemos obtener datos reales
        setDashboardData({
          totalSales: 245678,
          totalProducts: 156,
          lowStockItems: 8,
          salesGrowth: 12.5,
          recentSales: [],
          salesChartData: []
        });
        
        // Intentamos obtener ventas recientes si existe la tabla
        try {
          const { data: salesData } = await supabase
            .from('ventas')
            .select('*')
            .in('almacen_id', storeIds)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (salesData && salesData.length > 0) {
            setDashboardData(prev => ({
              ...prev,
              recentSales: salesData
            }));
          }
        } catch (e) {
          console.log('No se pudieron cargar ventas recientes', e);
        }
        
      } catch (error: any) {
        console.error("Error al cargar datos del dashboard:", error.message);
        toast.error("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [stores, storesLoading]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas Totales"
          value={`$${dashboardData.totalSales.toLocaleString()}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <StatCard
          title="Total Productos"
          value={dashboardData.totalProducts.toString()}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <StatCard
          title="Bajo Stock"
          value={dashboardData.lowStockItems.toString()}
          icon={<ActivitySquare className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <StatCard
          title="Crecimiento"
          value={`${dashboardData.salesGrowth}%`}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
          <SalesChart loading={loading} />
        </div>
        <div className="col-span-1">
          <InventorySummary loading={loading} />
        </div>
      </div>

      <div>
        <RecentSalesTable sales={dashboardData.recentSales} loading={loading} />
      </div>
    </div>
  );
}
