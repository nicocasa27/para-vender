
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

interface Props {
  data: Array<{
    name: string;
    value: number;
  }>;
}

export function TopProductsChart({ data }: Props) {
  const chartData = data.length > 0 ? data : [
    { name: "Sin datos", value: 0 }
  ];

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
        <Tooltip formatter={(value) => [value, 'Cantidad']} />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
