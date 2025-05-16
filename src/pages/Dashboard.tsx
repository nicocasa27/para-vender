
import React, { useState, useEffect } from "react";
import { 
  StatCard, 
  RecentSalesTable, 
  InventorySummary 
} from "@/components/dashboard";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { DollarSign, ShoppingBag, Truck, Coins } from "lucide-react";
import { fetchDashboardStats, DashboardStats } from "@/services/dashboard";

const Dashboard = () => {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelectedStoreIds(stores.map(store => store.id));
    }
  }, [stores]);
  
  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      try {
        const stats = await fetchDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Error cargando estadísticas del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardStats();
    
    // Actualizar los datos cada 5 minutos
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen de las métricas más importantes de su negocio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Ventas Hoy"
          value={isLoading ? "Cargando..." : `$${dashboardStats?.ventasHoy.total.toLocaleString() || 0}`}
          icon={DollarSign}
          description={`+${dashboardStats?.ventasHoy.porcentaje || 0}% respecto a ayer`}
          trend={dashboardStats?.ventasHoy.porcentaje}
          isLoading={isLoading}
        />
        <StatCard
          title="Productos Vendidos"
          value={isLoading ? "Cargando..." : (dashboardStats?.productosVendidos.total.toString() || "0")}
          icon={ShoppingBag}
          description={`+${dashboardStats?.productosVendidos.porcentaje || 0}% respecto a ayer`}
          trend={dashboardStats?.productosVendidos.porcentaje}
          isLoading={isLoading}
        />
        <StatCard
          title="Transferencias"
          value={isLoading ? "Cargando..." : (dashboardStats?.transferencias.total.toString() || "0")}
          icon={Truck}
          description={`+${dashboardStats?.transferencias.porcentaje || 0}% respecto a ayer`}
          trend={dashboardStats?.transferencias.porcentaje}
          isLoading={isLoading}
        />
        <StatCard
          title="Ventas Totales"
          value={isLoading ? "Cargando..." : `$${dashboardStats?.ventasTotales.total.toLocaleString() || 0}`}
          icon={Coins}
          description="Total histórico de ventas"
          isLoading={isLoading}
        />
      </div>

      {/* Layout modificado para que la tabla de ventas recientes ocupe todo el ancho */}
      <div className="grid gap-6 grid-cols-1">
        <RecentSalesTable storeIds={selectedStoreIds} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InventorySummary
          showLowStock={true}
          storeIds={selectedStoreIds}
        />
        <InventorySummary
          showLowStock={false}
          storeIds={selectedStoreIds}
        />
      </div>
    </div>
  );
};

export default Dashboard;
