
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MarginDataPoint } from "@/types/analytics";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";

export function MarginByCategory() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [data, setData] = useState<MarginDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { stores, isLoading: storesLoading } = useStores();
  
  // Define colors for the bars
  const salesColor = "#818cf8"; // Indigo
  const costsColor = "#fb7185"; // Rose
  const marginColor = "#10b981"; // Emerald
  
  useEffect(() => {
    // Set first store as default when stores load
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedStore) return;
      
      setLoading(true);
      try {
        // Determine date range based on period
        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(now.getMonth() - 1);
        }
        
        // Fetch sales data with product details including category and prices
        const { data: salesData, error: salesError } = await supabase
          .from('detalles_venta')
          .select(`
            cantidad,
            precio_unitario,
            productos:producto_id(id, nombre, categoria_id, precio_compra),
            categorias:productos.categoria_id(id, nombre),
            ventas:venta_id(id, created_at, almacen_id)
          `)
          .gte('ventas.created_at', startDate.toISOString())
          .lte('ventas.created_at', now.toISOString())
          .eq('ventas.almacen_id', selectedStore);
          
        if (salesError) throw salesError;
        
        // Group and calculate by category
        const marginByCategory: Record<string, { 
          category: string, 
          sales: number, 
          costs: number, 
          margin: number
        }> = {};
        
        salesData?.forEach(item => {
          if (!item.categorias?.nombre || !item.productos) return;
          
          const categoryName = item.categorias.nombre;
          const quantity = Number(item.cantidad) || 0;
          const salePrice = Number(item.precio_unitario) || 0;
          const costPrice = Number(item.productos.precio_compra) || 0;
          
          const saleTotal = quantity * salePrice;
          const costTotal = quantity * costPrice;
          const marginTotal = saleTotal - costTotal;
          
          if (!marginByCategory[categoryName]) {
            marginByCategory[categoryName] = {
              category: categoryName,
              sales: 0,
              costs: 0,
              margin: 0
            };
          }
          
          marginByCategory[categoryName].sales += saleTotal;
          marginByCategory[categoryName].costs += costTotal;
          marginByCategory[categoryName].margin += marginTotal;
        });
        
        // Format data for chart and sort by margin (highest first)
        const chartData = Object.values(marginByCategory)
          .map(item => ({
            category: item.category,
            sales: Number(item.sales.toFixed(1)),
            costs: Number(item.costs.toFixed(1)),
            margin: Number(item.margin.toFixed(1))
          }))
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 6); // Top 6 categories by margin
          
        setData(chartData);
      } catch (error) {
        console.error("Error fetching margin by category:", error);
        toast.error("Error al cargar datos de margen por categoría");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, selectedStore]);
  
  // Custom tooltip to show more detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const category = label;
      const salesValue = payload.find(p => p.dataKey === 'sales')?.value;
      const costsValue = payload.find(p => p.dataKey === 'costs')?.value;
      const marginValue = payload.find(p => p.dataKey === 'margin')?.value;
      
      // Calculate margin percentage
      const marginPercentage = (marginValue / salesValue * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium text-gray-900">{category}</p>
          <p className="text-sm text-indigo-600">
            <span className="font-medium">Ventas:</span> ${typeof salesValue === 'number' ? salesValue.toFixed(1) : 0}
          </p>
          <p className="text-sm text-rose-600">
            <span className="font-medium">Costos:</span> ${typeof costsValue === 'number' ? costsValue.toFixed(1) : 0}
          </p>
          <p className="text-sm text-emerald-600 font-medium">
            Margen: ${typeof marginValue === 'number' ? marginValue.toFixed(1) : 0} ({marginPercentage}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Margen por categoría</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Select 
              value={timeRange} 
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedStore || ''} 
              onValueChange={setSelectedStore}
              disabled={storesLoading}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tienda" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos disponibles para el período y tienda seleccionados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ bottom: 0 }} />
              <Bar dataKey="sales" name="Ventas" fill={salesColor} />
              <Bar dataKey="costs" name="Costos" fill={costsColor} />
              <Bar dataKey="margin" name="Margen" fill={marginColor} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
