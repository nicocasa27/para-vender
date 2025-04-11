
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
import { fetchTotalSalesByStore } from "@/services/analytics";
import { useStores } from "@/hooks/useStores";

interface TotalSalesByStoreChartProps {
  storeIds: string[];
  dateRange: string;
}

export function TotalSalesByStoreChart({ storeIds, dateRange }: TotalSalesByStoreChartProps) {
  const { stores } = useStores();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!storeIds || storeIds.length === 0) {
        setIsLoading(false);
        setChartData([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Cargando datos de ventas totales para tiendas:", storeIds, "rango:", dateRange);
        const data = await fetchTotalSalesByStore(storeIds, dateRange);
        console.log("Datos de ventas totales recibidos:", data);
        setChartData(data);
      } catch (err) {
        console.error("Error loading total store sales data:", err);
        setError("No se pudieron cargar los datos de ventas totales");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [storeIds, dateRange]);

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
          <CardTitle>Ventas Totales por Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas Totales por Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[350px]">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas Totales por Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[350px]">
            <p className="text-muted-foreground">No hay datos disponibles para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get store name by ID
  const getStoreName = (storeId: string) => {
    const store = stores?.find(s => s.id === storeId);
    return store ? store.nombre : 'Tienda desconocida';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Totales por Sucursal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="nombre" 
              label={{ value: 'Sucursal', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)} 
              label={{ value: 'Ventas Totales', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: any) => [formatCurrency(value), 'Ventas']}
            />
            <Legend />
            <Bar 
              dataKey="total" 
              name="Ventas Totales" 
              fill="#8884d8" 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
