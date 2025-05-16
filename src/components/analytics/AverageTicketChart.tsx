
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
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
import { Store, Sale, AverageTicketDataPoint } from "./custom-types";

interface Props {
  storeIds: string[];
  period: string;
}

export function AverageTicketChart({ storeIds, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [stores, setStores] = useState<(Store & { color: string })[]>([]);
  
  // Colors for the stores
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];
  
  useEffect(() => {
    const fetchStores = async () => {
      try {
        if (storeIds.length === 0) return;
        
        const { data: storesData, error } = await supabase
          .from('almacenes')
          .select('id, nombre')
          .in('id', storeIds);
          
        if (error) throw error;
        
        const storesWithColors = (storesData || []).map((store, index) => ({
          ...store,
          color: colors[index % colors.length]
        }));
        
        setStores(storesWithColors);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Error al cargar las sucursales");
      }
    };
    
    if (storeIds.length > 0) {
      fetchStores();
    }
  }, [storeIds]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (stores.length === 0) return;
      
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
        
        const formatDate = (date: Date) => {
          return date.toISOString().split('T')[0];
        };
        
        // Get average ticket per store from ventas table
        const storeTicketData: Record<string, AverageTicketDataPoint[]> = {};
        
        for (const store of stores) {
          const { data: ventasData, error } = await supabase
            .from('ventas')
            .select('id, total, created_at')
            .eq('almacen_id', store.id)
            .gte('created_at', formatDate(startDate))
            .lte('created_at', formatDate(today))
            .order('created_at', { ascending: true });
            
          if (error) throw error;
          
          if (ventasData && ventasData.length > 0) {
            // Group sales by date and calculate daily average
            const salesByDate: Record<string, { total: number, count: number }> = {};
            
            ventasData.forEach((venta: Sale) => {
              const date = new Date(venta.created_at).toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short' 
              });
              
              if (!salesByDate[date]) {
                salesByDate[date] = { total: 0, count: 0 };
              }
              
              salesByDate[date].total += Number(venta.total);
              salesByDate[date].count += 1;
            });
            
            storeTicketData[store.id] = Object.entries(salesByDate).map(([date, data]) => ({
              date,
              average: data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 0
            }));
          } else {
            storeTicketData[store.id] = [];
          }
        }
        
        // Combine data from all stores into chart format
        const allDates = new Set<string>();
        
        // Collect all unique dates
        Object.values(storeTicketData).forEach(storeData => {
          storeData.forEach(entry => allDates.add(entry.date));
        });
        
        // Create chart data with all dates and store averages
        const chartData = Array.from(allDates).sort().map(date => {
          const entry: any = { date };
          
          stores.forEach(store => {
            const storeDataPoint = storeTicketData[store.id]?.find(d => d.date === date);
            entry[store.nombre] = storeDataPoint?.average || 0;
          });
          
          return entry;
        });
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching average ticket:", error);
        toast.error("Error al cargar ticket promedio");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [stores, period]);
  
  if (loading) {
    return <Skeleton className="h-[350px] w-full rounded-md" />;
  }
  
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">
      No hay datos disponibles para el período seleccionado
    </div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis 
          tickFormatter={(value) => `$${value}`} 
          domain={['auto', 'auto']}
        />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toFixed(1)}`, '']}
        />
        <Legend />
        {stores.map((store) => (
          <Line
            key={store.id}
            type="monotone"
            dataKey={store.nombre}
            stroke={store.color}
            activeDot={{ r: 8 }}
            name={store.nombre}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
