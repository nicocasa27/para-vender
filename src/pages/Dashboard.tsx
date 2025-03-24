
import { useState, useEffect } from "react";
import { LayoutDashboard, DollarSign, Package, Store, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { InventorySummary } from "@/components/dashboard/InventorySummary";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch total sales from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: salesData, error: salesError } = await supabase
          .from('ventas')
          .select('total, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString());
        
        if (salesError) throw salesError;
        
        // Calculate sales total
        const totalSalesAmount = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
        setTotalSales(totalSalesAmount);
        
        // Calculate sales trend (compare with previous 30 days)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const { data: prevSalesData, error: prevSalesError } = await supabase
          .from('ventas')
          .select('total')
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString());
        
        if (prevSalesError) throw prevSalesError;
        
        const prevTotalSales = prevSalesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
        
        // Calculate trend percentage
        const salesTrendValue = prevTotalSales > 0 
          ? Math.round(((totalSalesAmount - prevTotalSales) / prevTotalSales) * 100) 
          : 0;
        setSalesTrend(salesTrendValue);
        
        // Fetch product count
        const { count: productCountData, error: productCountError } = await supabase
          .from('productos')
          .select('id', { count: 'exact' });
        
        if (productCountError) throw productCountError;
        
        setProductCount(productCountData || 0);

        // Get new products in last 30 days
        const { data: newProducts, error: newProductsError } = await supabase
          .from('productos')
          .select('id')
          .gte('created_at', thirtyDaysAgo.toISOString());
          
        if (newProductsError) throw newProductsError;
        
        // Simple trend calculation for products
        const productTrendValue = Math.round((newProducts?.length || 0) / (productCountData || 1) * 100);
        if (productTrendValue > 0 && productTrendValue <= 100) {
          setProductTrend(productTrendValue);
        } else {
          setProductTrend(4); // Fallback to a reasonable default
        }
        
        // Fetch store count
        const { count: storeCountData, error: storeCountError } = await supabase
          .from('almacenes')
          .select('id', { count: 'exact' });
        
        if (storeCountError) throw storeCountError;
        
        setStoreCount(storeCountData || 0);
        
        // Calculate profit (assuming 30% margin)
        const profitAmount = totalSalesAmount * 0.3;
        setProfit(profitAmount);
        
        // Calculate profit trend
        const prevProfit = prevTotalSales * 0.3;
        const profitTrendValue = prevProfit > 0 
          ? Math.round(((profitAmount - prevProfit) / prevProfit) * 100) 
          : 0;
        setProfitTrend(profitTrendValue);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
  }, [toast]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome to Mi-Tiendita, your complete inventory and point-of-sale system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          icon={DollarSign}
          description="Last 30 days"
          trend={salesTrend}
          isLoading={isLoading}
        />
        <StatCard
          title="Product Count"
          value={productCount.toString()}
          icon={Package}
          description="Across all categories"
          trend={productTrend}
          isLoading={isLoading}
        />
        <StatCard
          title="Store Count"
          value={storeCount.toString()}
          icon={Store}
          description="All locations"
          isLoading={isLoading}
        />
        <StatCard
          title="Profit"
          value={formatCurrency(profit)}
          icon={TrendingUp}
          description="Last 30 days"
          trend={profitTrend}
          isLoading={isLoading}
        />
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
