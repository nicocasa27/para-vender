
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Props {
  storeId: string | null;
  period: string;
}

export function ProductsNotSoldChart({ storeId, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // For demonstration, we're creating sample data
        // In a real app, this would be a call to your Supabase RPC or query
        
        // Generate sample data for products that have decreased in sales
        const sampleProducts = [
          { name: "Leche deslactosada", current: 25, previous: 85, change: -60 },
          { name: "Soda cola 3L", current: 10, previous: 45, change: -35 },
          { name: "Galletas surtidas", current: 15, previous: 45, change: -30 },
          { name: "Café instantáneo", current: 30, previous: 55, change: -25 },
          { name: "Cereal chocolate", current: 40, previous: 60, change: -20 },
          { name: "Atún en aceite", current: 45, previous: 65, change: -20 },
          { name: "Papel higiénico", current: 55, previous: 70, change: -15 },
          { name: "Detergente líquido", current: 60, previous: 75, change: -15 },
        ];
        
        setData(sampleProducts);
      } catch (error) {
        console.error("Error fetching non-selling products:", error);
        toast.error("Error al cargar productos sin ventas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [storeId, period]);
  
  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          tick={{ fontSize: 12 }}
          width={140}
        />
        <Tooltip 
          formatter={(value, name) => {
            return name === "change" 
              ? [`${value}%`, "Variación"] 
              : [value, name === "current" ? "Ventas actuales" : "Ventas anteriores"];
          }}
        />
        <ReferenceLine x={0} stroke="#000" />
        <Bar dataKey="change" fill="#ff8042" name="Variación %" />
      </BarChart>
    </ResponsiveContainer>
  );
}
