
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

interface ProductSalesChange {
  name: string;
  current: number;
  previous: number;
  change: number;
}

export function ProductsNotSoldChart({ storeId, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductSalesChange[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine date ranges for current and previous periods
        const today = new Date();
        let currentStartDate = new Date();
        let previousStartDate = new Date();
        let previousEndDate = new Date();
        
        switch (period) {
          case "week":
            currentStartDate.setDate(today.getDate() - 7);
            previousStartDate.setDate(today.getDate() - 14);
            previousEndDate.setDate(today.getDate() - 7);
            break;
          case "month":
            currentStartDate.setDate(today.getDate() - 30);
            previousStartDate.setDate(today.getDate() - 60);
            previousEndDate.setDate(today.getDate() - 30);
            break;
          case "year":
            currentStartDate.setMonth(today.getMonth() - 12);
            previousStartDate.setMonth(today.getMonth() - 24);
            previousEndDate.setMonth(today.getMonth() - 12);
            break;
          default:
            currentStartDate.setDate(today.getDate() - 7);
            previousStartDate.setDate(today.getDate() - 14);
            previousEndDate.setDate(today.getDate() - 7);
        }
        
        // Get all products
        const { data: products, error: prodError } = await supabase
          .from('productos')
          .select('id, nombre')
          .limit(100); // Limit to prevent performance issues
          
        if (prodError) throw prodError;
        
        if (!products || products.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }
        
        // Initialize product sales map
        const productSalesMap: Record<string, { name: string, current: number, previous: number }> = {};
        products.forEach(prod => {
          productSalesMap[prod.id] = { name: prod.nombre, current: 0, previous: 0 };
        });
        
        // Get current period sales
        let currentQuery = supabase
          .from('detalles_venta')
          .select(`
            producto_id, 
            cantidad,
            ventas:venta_id(almacen_id, created_at)
          `)
          .gte('ventas.created_at', currentStartDate.toISOString())
          .lte('ventas.created_at', today.toISOString());
          
        if (storeId && storeId !== "all") {
          currentQuery = currentQuery.eq('ventas.almacen_id', storeId);
        }
        
        const { data: currentSales, error: currentError } = await currentQuery;
        
        if (currentError) throw currentError;
        
        // Process current period sales
        if (currentSales && currentSales.length > 0) {
          currentSales.forEach(sale => {
            const productId = sale.producto_id;
            if (!productId || !productSalesMap[productId]) return;
            
            const cantidad = Number(sale.cantidad) || 0;
            productSalesMap[productId].current += cantidad;
          });
        }
        
        // Get previous period sales
        let previousQuery = supabase
          .from('detalles_venta')
          .select(`
            producto_id, 
            cantidad,
            ventas:venta_id(almacen_id, created_at)
          `)
          .gte('ventas.created_at', previousStartDate.toISOString())
          .lte('ventas.created_at', previousEndDate.toISOString());
          
        if (storeId && storeId !== "all") {
          previousQuery = previousQuery.eq('ventas.almacen_id', storeId);
        }
        
        const { data: previousSales, error: previousError } = await previousQuery;
        
        if (previousError) throw previousError;
        
        // Process previous period sales
        if (previousSales && previousSales.length > 0) {
          previousSales.forEach(sale => {
            const productId = sale.producto_id;
            if (!productId || !productSalesMap[productId]) return;
            
            const cantidad = Number(sale.cantidad) || 0;
            productSalesMap[productId].previous += cantidad;
          });
        }
        
        // Calculate changes and format data for chart
        const salesChanges: ProductSalesChange[] = Object.values(productSalesMap)
          .map(product => {
            let changePercent = 0;
            
            if (product.previous > 0) {
              changePercent = ((product.current - product.previous) / product.previous) * 100;
            } else if (product.current > 0) {
              changePercent = 100; // New product with sales
            }
            
            return {
              name: product.name,
              current: product.current,
              previous: product.previous,
              change: Number(changePercent.toFixed(1))
            };
          })
          // Filter for products with significant negative change
          .filter(product => product.previous > 0 && product.change < 0)
          // Sort by largest negative change first
          .sort((a, b) => a.change - b.change)
          // Take top 8 worst performing products
          .slice(0, 8);
        
        setData(salesChanges);
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
  
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[400px] text-muted-foreground">
      No hay datos de productos con disminución de ventas para el período seleccionado
    </div>;
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
            if (name === "change") 
              return [`${value.toFixed(1)}%`, "Variación"]; 
            else 
              return [value, name === "current" ? "Ventas actuales" : "Ventas anteriores"];
          }}
        />
        <ReferenceLine x={0} stroke="#000" />
        <Bar dataKey="change" fill="#ff8042" name="Variación %" />
      </BarChart>
    </ResponsiveContainer>
  );
}
