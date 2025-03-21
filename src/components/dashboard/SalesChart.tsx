
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// New simple types
type TimeRange = "daily" | "weekly" | "monthly";
type ProductSales = { name: string; value: number };

export const SalesChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [chartData, setChartData] = useState<ProductSales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<{id: string, nombre: string}[]>([]);
  const { toast } = useToast();

  // Fetch stores on component mount
  useEffect(() => {
    async function fetchStores() {
      try {
        const { data, error } = await supabase
          .from('almacenes')
          .select('id, nombre');
        
        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error('Error fetching stores:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las tiendas",
          variant: "destructive",
        });
      }
    }
    
    fetchStores();
  }, [toast]);

  // Fetch top selling products whenever filters change
  useEffect(() => {
    async function fetchTopSellingProducts() {
      setIsLoading(true);
      try {
        console.log(`Fetching data with timeRange: ${timeRange}, store: ${selectedStore}`);
        
        // Build the query
        let query = supabase
          .from('detalles_venta')
          .select(`
            cantidad,
            producto_id,
            productos:producto_id(nombre),
            ventas:venta_id(created_at, almacen_id)
          `);
        
        // Apply time filter
        const now = new Date();
        let startDate = new Date();
        
        if (timeRange === 'daily') {
          // Last 24 hours
          startDate.setDate(now.getDate() - 1);
        } else if (timeRange === 'weekly') {
          // Last 7 days
          startDate.setDate(now.getDate() - 7);
        } else {
          // Last 30 days
          startDate.setMonth(now.getMonth() - 1);
        }
        
        const isoStartDate = startDate.toISOString();
        query = query.gte('ventas.created_at', isoStartDate);
        
        // Filter by store if not "all"
        if (selectedStore !== "all") {
          query = query.eq('ventas.almacen_id', selectedStore);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        console.log(`Retrieved ${data?.length || 0} sales records`);
        
        // Process data to get top products
        const productSales: Record<string, ProductSales> = {};
        
        data?.forEach(sale => {
          const productId = sale.producto_id;
          const productName = sale.productos?.nombre || 'Producto Desconocido';
          const quantity = Number(sale.cantidad) || 0;
          
          if (!productSales[productId]) {
            productSales[productId] = {
              name: productName,
              value: 0
            };
          }
          
          productSales[productId].value += quantity;
        });
        
        // Convert to array, sort by quantity sold, and get top 10
        const topProducts = Object.values(productSales)
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        
        console.log(`Processed ${topProducts.length} top products`);
        setChartData(topProducts);
      } catch (error) {
        console.error('Error fetching product sales data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de ventas",
          variant: "destructive",
        });
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopSellingProducts();
  }, [timeRange, selectedStore, toast]);

  // Colors for bars
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#FF5733',
    '#C70039',
    '#900C3F'
  ];

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Productos Más Vendidos</CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={selectedStore}
            onValueChange={(value) => {
              console.log("Store selected:", value);
              setSelectedStore(value);
            }}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Tienda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Tiendas</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs
            defaultValue="monthly"
            value={timeRange}
            onValueChange={(value) => {
              console.log("Time range selected:", value);
              setTimeRange(value as TimeRange);
            }}
          >
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="daily" className="text-xs">Diario</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">Semanal</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">Mensual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[280px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  width={70}
                  tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value} unidades`, 'Vendido']}
                />
                <Bar 
                  dataKey="value" 
                  name="Unidades Vendidas"
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[280px] text-muted-foreground">
            No hay datos de ventas disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
};
