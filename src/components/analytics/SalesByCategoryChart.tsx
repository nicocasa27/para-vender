
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Props {
  data: Array<{
    category: string;
    value: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function SalesByCategoryChart({ data }: Props) {
  const chartData = data.length > 0 ? data : [{ category: "Sin datos", value: 1 }];

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
          nameKey="category"
          label={({ category, percent }) => 
            `${category}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
