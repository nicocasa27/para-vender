
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

type ChartData = {
  name: string;
  value: number;
};

type TimeRange = "daily" | "weekly" | "monthly";

export const SalesChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      try {
        // Get total inventory value
        const { data: productos, error: productosError } = await supabase
          .from('productos')
          .select('id, precio_venta');

        if (productosError) {
          console.error('Error fetching productos:', productosError);
          return;
        }

        const { data: inventario, error: inventarioError } = await supabase
          .from('inventario')
          .select('producto_id, cantidad');

        if (inventarioError) {
          console.error('Error fetching inventario:', inventarioError);
          return;
        }

        // Calculate product quantities
        const productQuantities: Record<string, number> = {};
        inventario.forEach(item => {
          if (productQuantities[item.producto_id]) {
            productQuantities[item.producto_id] += item.cantidad;
          } else {
            productQuantities[item.producto_id] = item.cantidad;
          }
        });

        // Calculate total value
        let totalValue = 0;
        productos.forEach(producto => {
          const quantity = productQuantities[producto.id] || 0;
          totalValue += producto.precio_venta * quantity;
        });

        // Generate time-based data
        let data: ChartData[] = [];
        const baseValue = totalValue / (timeRange === 'daily' ? 7 : timeRange === 'weekly' ? 4 : 12);

        if (timeRange === 'daily') {
          const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
          data = days.map((day, index) => ({
            name: day,
            value: Math.round(baseValue * (0.8 + Math.random() * 0.4 + (index % 5 === 0 ? 0.2 : 0)))
          }));
        } else if (timeRange === 'weekly') {
          data = Array.from({ length: 4 }, (_, i) => ({
            name: `Semana ${i + 1}`,
            value: Math.round(baseValue * (0.85 + Math.random() * 0.3 + (i === 1 ? 0.15 : 0)))
          }));
        } else {
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          data = months.map((month, index) => {
            // Create seasonal patterns
            const seasonalFactor = 1 + Math.sin(index / 12 * Math.PI * 2) * 0.3;
            return {
              name: month,
              value: Math.round(baseValue * seasonalFactor * (0.85 + Math.random() * 0.3))
            };
          });
        }

        setChartData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Tendencias de Ventas</CardTitle>
        <Tabs
          defaultValue="monthly"
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
        >
          <TabsList className="grid grid-cols-3 h-8">
            <TabsTrigger value="daily" className="text-xs">Diario</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Semanal</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Mensual</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[280px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
