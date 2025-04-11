
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesChart } from "@/components/dashboard";
import { SalesByCategoryChart } from "@/components/analytics/SalesByCategoryChart";
import { TopProductsChart } from "@/components/analytics/TopProductsChart";
import { RevenueOverTimeChart } from "@/components/analytics/RevenueOverTimeChart";
import { SalesDataPoint, CategoryDataPoint, ProductDataPoint } from "@/types/analytics";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesByStoreChart } from "@/components/analytics/SalesByStoreChart";
import { SalesByHourChart } from "@/components/analytics/SalesByHourChart";
import { SalesTrendByItemChart } from "@/components/analytics/SalesTrendByItemChart";
import { ProductsNotSoldChart } from "@/components/analytics/ProductsNotSoldChart";
import { AverageTicketChart } from "@/components/analytics/AverageTicketChart";
import { MarginByCategory } from "@/components/analytics/MarginByCategory";
import { LowStockTable } from "@/components/analytics/LowStockTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3Icon, TrendingUp, ShoppingBag, Clock, Calendar, DollarSign, TrendingDown, Receipt, PercentIcon, AlertCircle } from "lucide-react";

export default function Analytics() {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [salesByCategory, setSalesByCategory] = useState<CategoryDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductDataPoint[]>([]);
  const [revenueOverTime, setRevenueOverTime] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelectedStoreIds(stores.map(store => store.id));
      setSelectedStore(stores[0].id);
    }
  }, [stores]);

  const fetchAnalytics = async (period = "week") => {
    if (!stores || stores.length === 0) return;
    
    const storeIds = selectedStore ? [selectedStore] : stores.map(store => store.id);
    setLoading(true);
    
    try {
      const { data: salesCategoryData, error: salesCategoryError } = await supabase.rpc(
        "get_ventas_por_categoria",
        { store_ids: storeIds }
      );
      
      if (salesCategoryError) throw salesCategoryError;
      setSalesByCategory(salesCategoryData || []);
      
      const { data: topProductsData, error: topProductsError } = await supabase.rpc(
        "get_top_productos",
        { store_ids: storeIds }
      );
      
      if (topProductsError) throw topProductsError;
      setTopProducts(topProductsData || []);
      
      const { data: salesTimeData, error: salesTimeError } = await supabase.rpc(
        "get_ventas_por_dia",
        { store_ids: storeIds }
      );
      
      if (salesTimeError) throw salesTimeError;
      setRevenueOverTime(salesTimeData || []);
      
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
  }, [stores, loadingStores, dateRange, selectedStore]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Analíticas</h2>
        <p className="text-muted-foreground">
          Visualiza el rendimiento de ventas e inventario
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedStore || ''} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>Ventas diarias (últimos 30 días)</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueOverTimeChart data={revenueOverTime} loading={loading} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span>Ventas por Categoría</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesByCategoryChart data={salesByCategory} loading={loading} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5" />
                    <span>Top 10 Productos</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TopProductsChart data={topProducts} loading={loading} />
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Ventas totales por sucursal (comparativa mensual)</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesByStoreChart storeIds={selectedStoreIds} period={dateRange} />
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Horarios de mayor venta</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesByHourChart storeId={selectedStore} period={dateRange} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Productos con inventario crítico</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LowStockTable storeId={selectedStore} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Tendencia de ventas por ítem</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesTrendByItemChart storeId={selectedStore} period={dateRange} />
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  <span>Productos que han dejado de venderse</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductsNotSoldChart storeId={selectedStore} period={dateRange} />
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <span>Ticket promedio por tienda</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AverageTicketChart storeIds={selectedStoreIds} period={dateRange} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <PercentIcon className="h-5 w-5" />
                  <span>Margen de ganancia por categoría</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarginByCategory storeId={selectedStore} period={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
