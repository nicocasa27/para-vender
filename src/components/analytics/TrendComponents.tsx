
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
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
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={entry.trending === "up" ? "#82ca9d" : "#ff7782"}
              fillOpacity={entry.trending === "up" || entry.trending === "down" ? 1 : 0}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
