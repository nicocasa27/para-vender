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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNonSellingProducts } from "@/services/analyticService";

interface NonSellingProductsChartProps {
  storeIds: string[];
  dateRange: string;
}

export function NonSellingProductsChart({ storeIds, dateRange }: NonSellingProductsChartProps) {
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
        console.log("Cargando datos de productos sin ventas para tiendas:", storeIds, "rango:", dateRange);
        const data = await fetchNonSellingProducts(storeIds, dateRange);
        console.log("Datos de productos sin ventas recibidos:", data);
        setChartData(data);
      } catch (err) {
        console.error("Error loading non-selling products data:", err);
        setError("No se pudieron cargar los datos de productos sin ventas");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [storeIds, dateRange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos Sin Movimiento</CardTitle>
          <CardDescription>Productos que no han registrado ventas en el período seleccionado</CardDescription>
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
          <CardTitle>Productos Sin Movimiento</CardTitle>
          <CardDescription>Productos que no han registrado ventas en el período seleccionado</CardDescription>
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
          <CardTitle>Productos Sin Movimiento</CardTitle>
          <CardDescription>Productos que no han registrado ventas en el período seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[350px]">
            <p className="text-muted-foreground">No hay datos disponibles o todos los productos han tenido movimiento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limitar a 10 productos para mejor visualización
  const limitedData = chartData.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Sin Movimiento</CardTitle>
        <CardDescription>Productos que no han registrado ventas en el período seleccionado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={limitedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              label={{ value: 'Días sin ventas', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="category"
              dataKey="nombre"
              width={100}
            />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="dias_sin_venta" 
              name="Días sin ventas" 
              fill="#FF8042" 
            />
          </BarChart>
        </ResponsiveContainer>
        {chartData.length > 10 && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Mostrando los 10 productos con más tiempo sin ventas de un total de {chartData.length}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
