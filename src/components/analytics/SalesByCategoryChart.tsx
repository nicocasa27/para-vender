
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#0088FE", "#FFBB28"];

interface SalesByCategoryChartProps {
  data: any[];
}

export function SalesByCategoryChart({ data }: SalesByCategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoria"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry) => entry.categoria}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
