
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

// Helper function to get the current date in a specific format
function formatDate(date: Date, format: 'day' | 'week' | 'month'): string {
  if (format === 'day') {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  } else if (format === 'week') {
    const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
    return `Semana ${weekNumber}`;
  } else {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[date.getMonth()];
  }
}

// Helper function to get recent dates (days, weeks, months)
function getRecentDates(timeRange: TimeRange, count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  if (timeRange === 'daily') {
    // Get the last 'count' days
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(formatDate(date, 'day'));
    }
  } else if (timeRange === 'weekly') {
    // Get the last 'count' weeks
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - (i * 7));
      dates.push(formatDate(date, 'week'));
    }
  } else {
    // Get the last 'count' months including the current one
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      dates.push(formatDate(date, 'month'));
    }
  }
  
  return dates;
}

export const SalesChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      try {
        // Get actual sales data from the database based on the selected time range
        const { data: ventas, error: ventasError } = await supabase
          .from('ventas')
          .select('id, total, created_at')
          .order('created_at', { ascending: true });

        if (ventasError) {
          console.error('Error fetching ventas:', ventasError);
          return;
        }

        // Prepare the date ranges
        let recentDates: string[];
        if (timeRange === 'daily') {
          recentDates = getRecentDates('daily', 7);
        } else if (timeRange === 'weekly') {
          recentDates = getRecentDates('weekly', 4);
        } else {
          recentDates = getRecentDates('monthly', 6);
        }

        // Initialize chart data with zero values for all dates
        const initialChartData = recentDates.map(date => ({
          name: date,
          value: 0
        }));

        // If we have sales data, aggregate them by the appropriate time range
        if (ventas && ventas.length > 0) {
          ventas.forEach(venta => {
            const ventaDate = new Date(venta.created_at);
            let dateKey: string;
            
            if (timeRange === 'daily') {
              dateKey = formatDate(ventaDate, 'day');
            } else if (timeRange === 'weekly') {
              dateKey = formatDate(ventaDate, 'week');
            } else {
              dateKey = formatDate(ventaDate, 'month');
            }
            
            // Find the corresponding chart data entry and add the sale amount
            const dataPoint = initialChartData.find(item => item.name === dateKey);
            if (dataPoint) {
              dataPoint.value += venta.total;
            }
          });
        }

        setChartData(initialChartData);
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
