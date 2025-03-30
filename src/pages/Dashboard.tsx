
import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { InventorySummary } from "@/components/dashboard/InventorySummary";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { DollarSign, ShoppingBag, Truck, Users } from "lucide-react";

const Dashboard = () => {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [storeIds, setStoreIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (stores && stores.length > 0) {
      setStoreIds(stores.map(store => store.id));
    }
  }, [stores]);
  
  // Convert string values to numbers for proper typing
  const stats = [
    {
      title: "Ventas Hoy",
      value: 1254,
      icon: DollarSign,
      description: "+12% respecto a ayer",
    },
    {
      title: "Nuevos Clientes",
      value: 34,
      icon: Users,
      description: "+2% respecto a ayer",
    },
    {
      title: "Productos Vendidos",
      value: 324,
      icon: ShoppingBag,
      description: "+8% respecto a ayer",
    },
    {
      title: "Transferencias",
      value: 12,
      icon: Truck,
      description: "+4% respecto a ayer",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Resumen de las métricas más importantes de su negocio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
          <SalesChart />
        </div>
        <div>
          <RecentSalesTable />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
        <InventorySummary
          showLowStock={true}
        />
        <InventorySummary
          showLowStock={false}
        />
      </div>
    </div>
  );
};

export default Dashboard;
