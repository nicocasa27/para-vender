
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
        if (storeIds.length === 0) return;
        
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
        // Determine date range based on period
        const today = new Date();
        const months = [];
        const monthData: Record<string, Record<string, number>> = {};
        
        // Determine how many months to look back based on period
        let monthsToLookBack = 3;
        if (period === "year") {
          monthsToLookBack = 12;
        } else if (period === "week") {
          monthsToLookBack = 1;
        }
        
        // Generate month names for past N months
        for (let i = monthsToLookBack - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          
          const monthName = date.toLocaleString('es-ES', { month: 'long' });
          months.push(monthName);
          
          // Initialize month data for each store
          monthData[monthName] = {};
          stores.forEach(store => {
            monthData[monthName][store.id] = 0;
          });
        }
        
        // Get sales data for each store
        for (const store of stores) {
          // Calculate date range for query
          const startDate = new Date();
          startDate.setMonth(today.getMonth() - monthsToLookBack);
          startDate.setDate(1); // First day of month
          
          const { data: salesData, error } = await supabase
            .from('ventas')
            .select('total, created_at')
            .eq('almacen_id', store.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', today.toISOString());
            
          if (error) throw error;
          
          if (salesData && salesData.length > 0) {
            // Aggregate sales by month
            salesData.forEach(sale => {
              const saleDate = new Date(sale.created_at);
              const monthName = saleDate.toLocaleString('es-ES', { month: 'long' });
              
              if (monthData[monthName] && monthData[monthName][store.id] !== undefined) {
                monthData[monthName][store.id] += Number(sale.total);
              }
            });
          }
        }
        
        // Format data for chart
        const chartData = months.map(month => {
          const entry: any = { month };
          
          stores.forEach(store => {
            const storeTotal = monthData[month][store.id];
            entry[store.nombre] = Number(storeTotal.toFixed(1));
          });
          
          return entry;
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
  
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[400px] text-muted-foreground">
      No hay datos de ventas disponibles para el período seleccionado
    </div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(1)}K`} />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toFixed(1)}`, '']} 
        />
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
