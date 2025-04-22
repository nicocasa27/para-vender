
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSalesToday } from "@/services/salesService";

export function DailySalesView() {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['dailySales'],
    queryFn: fetchSalesToday
  });

  // Procesar los datos para agruparlos por hora
  const processedData = React.useMemo(() => {
    if (!salesData) return [];

    const salesByHour: { [key: string]: number } = {};
    
    // Inicializar todas las horas del día con 0
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      salesByHour[hour] = 0;
    }

    // Agrupar ventas por hora
    salesData.forEach((sale: any) => {
      const hour = new Date(sale.created_at).getHours().toString().padStart(2, '0');
      salesByHour[hour] = (salesByHour[hour] || 0) + Number(sale.total);
    });

    // Convertir a array para Recharts
    return Object.entries(salesByHour).map(([hour, total]) => ({
      hour: `${hour}:00`,
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
        <CardTitle>Ventas por Hora del Día</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour"
                interval={2}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                labelFormatter={(label) => `Hora: ${label}`}
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
