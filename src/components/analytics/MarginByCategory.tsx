
import React, { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Props {
  storeId: string | null;
  period: string;
}

export function MarginByCategory({ storeId, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // For demonstration, we're creating sample data
        // In a real app, this would be a call to your Supabase RPC or query
        
        // Sample margin data by category
        const marginData = [
          { name: "Bebidas", sales: 120000, cost: 72000, margin: 40 },
          { name: "Lácteos", sales: 85000, cost: 59500, margin: 30 },
          { name: "Carnes", sales: 95000, cost: 71250, margin: 25 },
          { name: "Abarrotes", sales: 150000, cost: 105000, margin: 30 },
          { name: "Snacks", sales: 75000, cost: 37500, margin: 50 },
          { name: "Frutas/Verduras", sales: 65000, cost: 45500, margin: 30 },
          { name: "Panadería", sales: 45000, cost: 27000, margin: 40 },
          { name: "Limpieza", sales: 55000, cost: 33000, margin: 40 },
        ];
        
        setData(marginData);
      } catch (error) {
        console.error("Error fetching margin data:", error);
        toast.error("Error al cargar datos de margen");
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
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
        <Tooltip 
          formatter={(value, name) => {
            if (name === "margin") return [`${value}%`, "Margen"];
            return [`$${Number(value).toLocaleString()}`, name === "sales" ? "Ventas" : "Costo"];
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" name="Ventas" fill="#8884d8" />
        <Bar yAxisId="left" dataKey="cost" name="Costo" fill="#82ca9d" />
        <Bar yAxisId="right" dataKey="margin" name="Margen %" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
}
