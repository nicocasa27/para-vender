import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

export default function SalesByCategoryChart() {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("ventas_por_categoria").select("*");
      if (error) {
        toast({
          title: "Error al cargar ventas por categoría",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setData(data || []);
    };
    fetchData();
  }, [toast]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoria"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
