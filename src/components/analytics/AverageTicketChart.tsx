
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

interface Props {
  storeIds: string[];
  period: string;
}

interface StoreData {
  id: string;
  nombre: string;
  color: string;
}

export function AverageTicketChart({ storeIds, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  
  // Colors for the stores
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];
  
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data: storesData, error } = await supabase
          .from('almacenes')
          .select('id, nombre')
          .in('id', storeIds);
          
        if (error) throw error;
        
        const storesWithColors = storesData.map((store, index) => ({
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
        // For demonstration, we're creating sample data
        // In a real app, this would be a call to your Supabase RPC or query
        
        // Generate dates for the last 10 days
        const days = 10;
        const chartData = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          const dayData: any = {
            date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
          };
          
          // Add average ticket data for each store
          stores.forEach(store => {
            // Generate realistic average ticket values between $100 and $350
            const baseValue = 100 + Math.floor(Math.random() * 150);
            // Add some variation (+/- 50) based on store
            const storeMultiplier = parseFloat(store.id) % 3 === 0 ? 1.2 : 1;
            
            dayData[store.nombre] = Math.round(baseValue * storeMultiplier);
          });
          
          chartData.push(dayData);
        }
        
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
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
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
