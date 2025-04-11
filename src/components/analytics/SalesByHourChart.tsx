
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Props {
  storeId: string | null;
  period: string;
}

export function SalesByHourChart({ storeId, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // For demonstration, we're creating sample data
        // In a real app, this would be a call to your Supabase RPC or query
        
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const chartData = hours.map(hour => {
          // Generate realistic sales pattern with higher volumes during typical shopping hours
          let value;
          if (hour >= 8 && hour <= 20) {
            // Shopping hours - higher sales
            // Peaks at lunch time and after work
            if (hour >= 12 && hour <= 14) {
              value = Math.floor(Math.random() * 20000) + 15000; // Lunch time peak
            } else if (hour >= 17 && hour <= 19) {
              value = Math.floor(Math.random() * 25000) + 20000; // After work peak
            } else {
              value = Math.floor(Math.random() * 15000) + 5000; // Regular shopping hours
            }
          } else {
            // Non-shopping hours - lower sales
            value = Math.floor(Math.random() * 3000);
          }
          
          return {
            hour: `${hour}:00`,
            value
          };
        });
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching sales by hour:", error);
        toast.error("Error al cargar ventas por hora");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [storeId, period]);
  
  if (loading) {
    return <Skeleton className="h-[350px] w-full rounded-md" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="hour" 
          tick={{ fontSize: 12 }}
          interval={1}
        />
        <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
          labelFormatter={(label) => `Hora: ${label}`}
        />
        <Bar 
          dataKey="value" 
          fill="#8884d8"
          name="Ventas"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
