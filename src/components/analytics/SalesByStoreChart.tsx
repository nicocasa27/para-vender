
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
  storeIds: string[];
  period: string;
}

interface StoreData {
  id: string;
  nombre: string;
  color: string;
}

export function SalesByStoreChart({ storeIds, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  
  // Colors for the stores
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];
  
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
        
        // Get the last 3 months
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const today = new Date();
        const lastMonths = [];
        
        for (let i = 2; i >= 0; i--) {
          const monthIndex = today.getMonth() - i;
          const actualMonth = monthIndex >= 0 ? monthIndex : 12 + monthIndex;
          lastMonths.push(months[actualMonth]);
        }
        
        // Generate chart data with realistic sample data
        const chartData = lastMonths.map(month => {
          const monthData: any = { month };
          
          stores.forEach(store => {
            // Generate random sales between 10000 and 100000
            monthData[store.nombre] = Math.floor(Math.random() * 90000) + 10000;
          });
          
          return monthData;
        });
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching sales by store:", error);
        toast.error("Error al cargar ventas por sucursal");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [stores, period]);
  
  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
        <Legend />
        {stores.map((store) => (
          <Bar 
            key={store.id} 
            dataKey={store.nombre} 
            fill={store.color} 
            name={store.nombre}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
