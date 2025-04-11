
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStoreMonthlySales } from "@/services/analyticService";
import { useStores } from "@/hooks/useStores";

interface StoreMonthlySalesChartProps {
  storeIds: string[];
}

export function StoreMonthlySalesChart({ storeIds }: StoreMonthlySalesChartProps) {
  const { stores } = useStores();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!storeIds || storeIds.length === 0) return;
      
      setIsLoading(true);
      try {
        const data = await fetchStoreMonthlySales(storeIds);
        setChartData(data);
      } catch (error) {
        console.error("Error loading store monthly sales data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [storeIds]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas Totales por Sucursal (Comparativa Mensual)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas Totales por Sucursal (Comparativa Mensual)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[350px]">
            <p className="text-muted-foreground">No hay datos disponibles para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get store colors for the bars
  const getStoreColors = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    const storeColors: Record<string, string> = {};
    
    if (stores) {
      stores.forEach((store, index) => {
        storeColors[store.id] = colors[index % colors.length];
      });
    }
    
    return storeColors;
  };

  const storeColors = getStoreColors();
  
  // Get store name by ID
  const getStoreName = (storeId: string) => {
    const store = stores?.find(s => s.id === storeId);
    return store ? store.nombre : 'Tienda desconocida';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Totales por Sucursal (Comparativa Mensual)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              label={{ value: 'Mes', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)} 
              label={{ value: 'Ventas Totales', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: any) => [formatCurrency(value), 'Ventas']}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Legend />
            {storeIds.map(storeId => (
              <Bar 
                key={storeId}
                dataKey={storeId}
                name={getStoreName(storeId)}
                fill={storeColors[storeId] || '#8884d8'}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
