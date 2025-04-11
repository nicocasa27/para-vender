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
import { fetchItemSalesTrend } from "@/services/analyticService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Props {
  storeId: string | null;
  period: string;
}

interface Product {
  id: string;
  nombre: string;
}

export function SalesTrendByItemChart({ storeId, period }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Colors for the products
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('productos')
          .select('id, nombre')
          .limit(20);
          
        if (error) throw error;
        
        setProducts(productsData);
        
        // Select first 3 products by default
        if (productsData.length > 0) {
          setSelectedProducts(productsData.slice(0, 3).map(p => p.id));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Error al cargar productos");
      }
    };
    
    fetchProducts();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      if (selectedProducts.length === 0) return;
      
      setLoading(true);
      try {
        // For demonstration, we're creating sample data
        // In a real app, this would be a call to your Supabase RPC or query
        
        // Generate dates for the last 7 days
        const days = 7;
        const chartData = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          const dayData: any = {
            date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
          };
          
          // Add data for each selected product
          selectedProducts.forEach(productId => {
            const product = products.find(p => p.id === productId);
            if (product) {
              // Generate trend data with some correlation to previous day
              const baseValue = Math.floor(Math.random() * 50) + 10;
              const trend = Math.random() > 0.7 ? -1 : 1; // Sometimes go down, usually go up
              
              dayData[product.nombre] = Math.max(5, baseValue + (trend * (Math.random() * 15)));
            }
          });
          
          chartData.push(dayData);
        }
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching sales trend:", error);
        toast.error("Error al cargar tendencia de ventas");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedProducts, storeId, period, products]);
  
  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        // Limit to 5 products for readability
        const newSelection = [...prev, productId];
        return newSelection.slice(0, 5);
      }
    });
  };
  
  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {products.slice(0, 10).map((product, index) => (
          <button
            key={product.id}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedProducts.includes(product.id) 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => handleProductToggle(product.id)}
          >
            {product.nombre}
          </button>
        ))}
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedProducts.map((productId, index) => {
            const product = products.find(p => p.id === productId);
            if (!product) return null;
            
            return (
              <Line
                key={productId}
                type="monotone"
                dataKey={product.nombre}
                stroke={colors[index % colors.length]}
                activeDot={{ r: 8 }}
                name={product.nombre}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
