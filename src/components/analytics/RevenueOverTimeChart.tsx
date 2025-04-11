
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { SalesDataPoint } from "@/types/analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: SalesDataPoint[];
  loading?: boolean;
}

export function RevenueOverTimeChart({ data, loading }: Props) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full rounded-md" />;
  }
  
  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    name: item.fecha,
    value: Number(item.total)
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ingresos']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
