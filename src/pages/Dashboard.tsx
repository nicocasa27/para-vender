
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, ShoppingCart, Users, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";

export default function Dashboard() {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [stats, setStats] = useState({
    sales: 0,
    products: 0,
    users: 0,
    growth: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (loadingStores || stores.length === 0) return;
      
      setLoading(true);
      const storeIds = stores.map(store => store.id);
      
      try {
        // Fetch summary stats
        const { data: salesData } = await supabase
          .from("ventas")
          .select("total")
          .in("almacen_id", storeIds);
          
        const { count: productsCount } = await supabase
          .from("productos")
          .select("id", { count: 'exact', head: true });
          
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("id", { count: 'exact', head: true });
          
        // Calculate total sales
        const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
        
        // Fetch recent sales for table
        const { data: recent } = await supabase
          .from("ventas")
          .select(`
            id,
            total,
            created_at,
            cliente,
            almacen:almacen_id(nombre)
          `)
          .in("almacen_id", storeIds)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setStats({
          sales: totalSales,
          products: productsCount || 0,
          users: usersCount || 0,
          growth: 18 // Placeholder value
        });
        
        setRecentSales(recent || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [stores, loadingStores]);

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ventas</CardTitle>
            <ShoppingCart />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">${stats.sales.toLocaleString()}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos</CardTitle>
            <Warehouse />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">{stats.products}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuarios</CardTitle>
            <Users />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">{stats.users}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Estadísticas</CardTitle>
            <BarChart />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <p className="text-2xl font-bold">+{stats.growth}%</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
