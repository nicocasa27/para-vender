import { useState, useEffect } from "react";
import { LayoutDashboard, DollarSign, Package, Store, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { InventorySummary } from "@/components/dashboard/InventorySummary";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStores } from "@/hooks/useCurrentStores"; // ✅ nuevo hook

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [storeCount, setStoreCount] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [salesTrend, setSalesTrend] = useState<number>(0);
  const [productTrend, setProductTrend] = useState<number>(0);
  const [profitTrend, setProfitTrend] = useState<number>(0);
  const { toast } = useToast();

  const { storeIds, isLoading: isStoreLoading } = useCurrentStores();

  useEffect(() => {
    if (isStoreLoading || storeIds.length === 0) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { data: salesData, error: salesError } = await supabase
          .from("ventas")
          .select("total, created_at, almacen_id")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .in("almacen_id", storeIds);

        if (salesError) throw salesError;

        const totalSalesAmount = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
        setTotalSales(totalSalesAmount);

        const { data: prevSalesData, error: prevSalesError } = await supabase
          .from("ventas")
          .select("total, almacen_id")
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString())
          .in("almacen_id", storeIds);

        if (prevSalesError) throw prevSalesError;

        const prevTotalSales = prevSalesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

        const salesTrendValue =
          prevTotalSales > 0 ? Math.round(((totalSalesAmount - prevTotalSales) / prevTotalSales) * 100) : 0;
        setSalesTrend(salesTrendValue);

        const { count: productCountData, error: productCountError } = await supabase
          .from("productos")
          .select("id", { count: "exact", head: true })
          .in("almacen_id", storeIds);

        if (productCountError) throw productCountError;
        setProductCount(productCountData || 0);

        const { data: newProducts, error: newProductsError } = await supabase
          .from("productos")
          .select("id")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .in("almacen_id", storeIds);

        if (newProductsError) throw newProductsError;

        const productTrendValue = Math.round(((newProducts?.length || 0) / (productCountData || 1)) * 100);
        setProductTrend(productTrendValue > 0 && productTrendValue <= 100 ? productTrendValue : 4);

        const { count: storeCountData, error: storeCountError } = await supabase
          .from("almacenes")
          .select("id", { count: "exact", head: true });

        if (storeCountError) throw storeCountError;
        setStoreCount(storeCountData || 0);

        const profitAmount = totalSalesAmount * 0.3;
        setProfit(profitAmount);

        const prevProfit = prevTotalSales * 0.3;
        const profitTrendValue = prevProfit > 0 ? Math.round(((profitAmount - prevProfit) / prevProfit) * 100) : 0;
        setProfitTrend(profitTrendValue);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast, storeIds, isStoreLoading]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Bienvenido a Mi-Tiendita, tu sistema integral de inventario y punto de venta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Ventas" value={formatCurrency(totalSales)} icon={DollarSign} description="Últimos 30 días" trend={salesTrend} isLoading={isLoading} />
        <StatCard title="Productos" value={productCount.toString()} icon={Package} description="Inventario actual" trend={productTrend} isLoading={isLoading} />
        <StatCard title="Sucursales Totales" value={storeCount.toString()} icon={Store} description="Todas las sucursales" isLoading={isLoading} />
        <StatCard title="Ganancia" value={formatCurrency(profit)} icon={TrendingUp} description="Estimado último mes" trend={profitTrend} isLoading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart />
        <InventorySummary />
      </div>

      <RecentSalesTable />
    </div>
  );
};

export default Dashboard;
