
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

interface SalesByHourChartProps {
  storeId: string | null;
  period: string;
}

export function SalesByHourChart({ storeId, period }: SalesByHourChartProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine date range based on period
        const today = new Date();
        let startDate = new Date();
        
        switch (period) {
          case "week":
            startDate.setDate(today.getDate() - 7);
            break;
          case "month":
            startDate.setDate(today.getDate() - 30);
            break;
          case "year":
            startDate.setMonth(today.getMonth() - 12);
            break;
          default:
            startDate.setDate(today.getDate() - 7);
        }
        
        // Initialize hour data
        const hourData: Record<string, number> = {};
        for (let i = 0; i < 24; i++) {
          hourData[`${i}:00`] = 0;
        }
        
        // Query ventas data
        let query = supabase
          .from('ventas')
          .select('id, total, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', today.toISOString());
          
        if (storeId) {
          query = query.eq('almacen_id', storeId);
        }
        
        const { data: ventasData, error } = await query;
        
        if (error) throw error;
        
        if (ventasData && ventasData.length > 0) {
          // Aggregate sales by hour
          ventasData.forEach(venta => {
            const ventaDate = new Date(venta.created_at);
            const hour = ventaDate.getHours();
            const hourKey = `${hour}:00`;
            
            hourData[hourKey] += Number(venta.total);
          });
        }
        
        // Format data for chart
        const chartData = Object.entries(hourData).map(([hour, value]) => ({
          hour,
          value: Number(value.toFixed(1))
        }));
        
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
  
  if (data.every(item => item.value === 0)) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">
      No hay datos de ventas disponibles para el período seleccionado
    </div>;
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
        <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(1)}K`} />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toFixed(1)}`, 'Ventas']}
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
