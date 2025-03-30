
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { supabase } from "@/integrations/supabase/client";
import { SalesDataPoint, CategoryDataPoint, ProductDataPoint } from "@/types/analytics";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("week");
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [productData, setProductData] = useState<ProductDataPoint[]>([]);
  
  const fetchAnalytics = async (period = "week") => {
    setLoading(true);
    try {
      // Fetch sales over time
      const { data: salesTimeData, error: salesTimeError } = await supabase.rpc(
        "get_sales_over_time",
        { period_param: period }
      );
      
      if (salesTimeError) throw salesTimeError;
      setSalesData(salesTimeData || []);
      
      // Fetch sales by category
      const { data: salesCategoryData, error: salesCategoryError } = await supabase.rpc(
        "get_sales_by_category",
        { period_param: period }
      );
      
      if (salesCategoryError) throw salesCategoryError;
      setCategoryData(salesCategoryData || []);
      
      // Fetch top products
      const { data: topProductsData, error: topProductsError } = await supabase.rpc(
        "get_top_products",
        { period_param: period, limit_param: 5 }
      );
      
      if (topProductsError) throw topProductsError;
      setProductData(topProductsData || []);
      
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // You could use toast here
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analíticas</h2>
        <p className="text-muted-foreground mt-2">
          Visualiza el rendimiento de ventas e inventario
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Visión General</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
          </TabsList>
          
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
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos por Periodo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueOverTimeChart data={salesData} loading={loading} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesByCategoryChart data={categoryData} loading={loading} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Productos Más Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopProductsChart data={productData} loading={loading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
