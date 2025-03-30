import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

export default function TopProductsChart() {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("ventas_top_productos").select("*");
      if (error) {
        toast({
          title: "Error al cargar productos más vendidos",
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
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="producto" type="category" />
        <Tooltip />
        <Bar dataKey="total">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
