
import React from "react";
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

interface TrendBarChartProps {
  data: Array<{
    name: string;
    trendPercentage: number;
    trending: "up" | "down" | "stable";
  }>;
  height?: number;
}

export function TrendBarChart({ data, height = 400 }: TrendBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, "Variación"]}
        />
        <Legend />
        <Bar
          dataKey="trendPercentage"
          name="Variación porcentual"
          fill="#82ca9d"
          // Usamos un callback en fillOpacity en lugar de fill para cambiar el color
          fillOpacity={(entry) => entry.trending === "up" ? 1 : 0}
        />
        <Bar
          dataKey="trendPercentage"
          name="Variación porcentual negativa"
          fill="#ff7782"
          // Usamos visibilidad para mostrar solo los valores negativos
          fillOpacity={(entry) => entry.trending === "down" ? 1 : 0}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
