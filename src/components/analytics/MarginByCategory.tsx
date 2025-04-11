
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

interface MarginData {
  name: string;
  sales: number;
  cost: number;
  margin: number;
}

export function MarginByCategory({ storeId, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MarginData[]>([]);
  
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
        
        // Get all categories
        const { data: categories, error: catError } = await supabase
          .from('categorias')
          .select('id, nombre');
          
        if (catError) throw catError;
        
        if (!categories || categories.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }
        
        // Initialize margin data by category
        const categoryMap: Record<string, { name: string, sales: number, cost: number }> = {};
        categories.forEach(cat => {
          categoryMap[cat.id] = { name: cat.nombre, sales: 0, cost: 0 };
        });
        
        // Get products with categories
        const { data: products, error: prodError } = await supabase
          .from('productos')
          .select('id, nombre, categoria_id, precio_venta, precio_compra');
          
        if (prodError) throw prodError;
        
        // Create product price map
        const productPriceMap: Record<string, { venta: number, compra: number, categoria_id: string | null }> = {};
        products.forEach(prod => {
          productPriceMap[prod.id] = { 
            venta: Number(prod.precio_venta) || 0, 
            compra: Number(prod.precio_compra) || 0,
            categoria_id: prod.categoria_id
          };
        });
        
        // Query for sales
        let query = supabase
          .from('detalles_venta')
          .select(`
            id, 
            producto_id, 
            cantidad, 
            precio_unitario,
            venta_id,
            ventas:venta_id(almacen_id, created_at)
          `)
          .gte('ventas.created_at', startDate.toISOString())
          .lte('ventas.created_at', today.toISOString());
          
        if (storeId && storeId !== "all") {
          query = query.eq('ventas.almacen_id', storeId);
        }
        
        const { data: salesDetails, error: salesError } = await query;
        
        if (salesError) throw salesError;
        
        if (salesDetails && salesDetails.length > 0) {
          // Process sales data
          salesDetails.forEach(detail => {
            const productId = detail.producto_id;
            if (!productId || !productPriceMap[productId]) return;
            
            const categoriaId = productPriceMap[productId].categoria_id;
            if (!categoriaId || !categoryMap[categoriaId]) return;
            
            const cantidad = Number(detail.cantidad) || 0;
            const precioVenta = Number(detail.precio_unitario) || productPriceMap[productId].venta;
            const precioCompra = productPriceMap[productId].compra;
            
            categoryMap[categoriaId].sales += precioVenta * cantidad;
            categoryMap[categoriaId].cost += precioCompra * cantidad;
          });
        }
        
        // Format data for chart
        const marginData: MarginData[] = Object.values(categoryMap)
          .filter(cat => cat.sales > 0 || cat.cost > 0) // Only include categories with data
          .map(cat => {
            const margin = cat.sales > 0 
              ? Number(((cat.sales - cat.cost) / cat.sales * 100).toFixed(1))
              : 0;
              
            return {
              name: cat.name,
              sales: Number(cat.sales.toFixed(1)),
              cost: Number(cat.cost.toFixed(1)),
              margin
            };
          })
          .sort((a, b) => b.sales - a.sales); // Sort by sales descending
        
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
  
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[400px] text-muted-foreground">
      No hay datos de margen disponibles para el período seleccionado
    </div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          tickFormatter={(value) => `$${(Number(value)/1000).toFixed(1)}K`} 
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tickFormatter={(value) => `${Number(value).toFixed(1)}%`} 
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === "margin") return [`${Number(value).toFixed(1)}%`, "Margen"];
            return [`$${Number(value).toFixed(1)}`, name === "sales" ? "Ventas" : "Costo"];
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
