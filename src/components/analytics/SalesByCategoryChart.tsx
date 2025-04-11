
import React from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
import { CategoryDataPoint } from "@/types/analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: CategoryDataPoint[];
  loading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function SalesByCategoryChart({ data, loading }: Props) {
  if (loading) {
    return <Skeleton className="h-[250px] w-full rounded-md" />;
  }
  
  // Preparar datos para el gráfico
  const chartData = data.map(item => ({
    name: item.categoria,
    value: Number(item.total)
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => 
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
