
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSales } from "@/services/salesService";

export function DailySalesView() {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['dailySales'],
    queryFn: () => fetchSales(30) // Obtener los últimos 30 días de ventas
  });

  // Procesar los datos para agruparlos por día
  const processedData = React.useMemo(() => {
    if (!salesData) return [];

    const salesByDay: { [key: string]: number } = {};
    
    // Inicializar los últimos 30 días con 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      salesByDay[dayKey] = 0;
    }

    // Agrupar ventas por día
    salesData.forEach((sale: any) => {
      const dayKey = new Date(sale.created_at).toISOString().split('T')[0];
      if (salesByDay[dayKey] !== undefined) {
        salesByDay[dayKey] = (salesByDay[dayKey] || 0) + Number(sale.total);
      }
    });

    // Convertir a array para Recharts
    return Object.entries(salesByDay).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('es-ES', { 
        day: '2-digit',
        month: '2-digit'
      }),
      total
    }));
  }, [salesData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                interval={2}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
