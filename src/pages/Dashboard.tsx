
import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { InventorySummary } from "@/components/dashboard/InventorySummary";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { stores, isLoading, hasStores } = useCurrentStores();
  
  // Create a storeIds map for the child components
  const storeIdsMap = stores.reduce((acc, store) => {
    acc[store.id] = store.nombre;
    return acc;
  }, {} as Record<string, string>);
  
  // Convert to array format for components that expect an array
  const storeIdsArray = stores.map(store => store.id);

  return (
    <div>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Vista general del rendimiento del negocio y estadísticas clave.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Ventas Totales" 
              value="$12,254" 
              description="+20.1% desde el mes pasado" 
              trend="up"
            />
            <StatCard 
              title="Nuevos Clientes" 
              value="132" 
              description="+19% desde el mes pasado" 
              trend="up"
            />
            <StatCard 
              title="Productos Vendidos" 
              value="2,845" 
              description="+12.2% desde el mes pasado" 
              trend="up"
            />
            <StatCard 
              title="Rentabilidad" 
              value="32.5%" 
              description="-4% desde el mes pasado" 
              trend="down"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Ventas Semanales</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart storeIds={storeIdsArray} />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentSalesTable storeIds={storeIdsArray} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="low">
                <TabsList>
                  <TabsTrigger value="low">Stock Bajo</TabsTrigger>
                  <TabsTrigger value="all">Todo el Inventario</TabsTrigger>
                </TabsList>
                <TabsContent value="low" className="mt-4">
                  <InventorySummary storeIds={storeIdsArray} showLowStock={true} />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <InventorySummary storeIds={storeIdsArray} showLowStock={false} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </div>
  );
}
