
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentSalesTable from "@/components/dashboard/RecentSalesTable";
import InventorySummary from "@/components/dashboard/InventorySummary";
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
      value: 1254, // Number instead of string
      icon: <DollarSign className="h-5 w-5" />,
      description: "+12% respecto a ayer",
    },
    {
      title: "Nuevos Clientes",
      value: 34, // Number instead of string
      icon: <Users className="h-5 w-5" />,
      description: "+2% respecto a ayer",
    },
    {
      title: "Productos Vendidos",
      value: 324, // Number instead of string
      icon: <ShoppingBag className="h-5 w-5" />,
      description: "+8% respecto a ayer",
    },
    {
      title: "Transferencias",
      value: 12, // Number instead of string
      icon: <Truck className="h-5 w-5" />,
      description: "+4% respecto a ayer",
    },
  ];

  return (
    <MainLayout>
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
          <SalesChart
            storeIds={storeIds}
          />
          <RecentSalesTable
            storeIds={storeIds}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
          <InventorySummary
            storeIds={storeIds}
            showLowStock={true}
          />
          <InventorySummary
            storeIds={storeIds}
            showLowStock={false}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
