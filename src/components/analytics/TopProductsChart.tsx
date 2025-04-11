
import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { ProductDataPoint } from "@/types/analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: ProductDataPoint[];
  loading?: boolean;
}

export function TopProductsChart({ data, loading }: Props) {
  if (loading) {
    return <Skeleton className="h-[250px] w-full rounded-md" />;
  }
  
  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    name: item.producto,
    value: Number(item.total)
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          tick={{ fontSize: 12 }}
          width={100}
        />
        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ventas']} />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
