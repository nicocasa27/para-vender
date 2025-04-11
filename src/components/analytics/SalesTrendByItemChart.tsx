
import React, { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchItemSalesTrend } from "@/services/analyticService";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", 
  "#00c49f", "#ffbb28", "#ff8042", "#a4de6c", "#d0ed57"
];

export function SalesTrendByItemChart() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<{id: string, nombre: string}[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { stores, isLoading: storesLoading } = useStores();
  
  // Load store and product data
  useEffect(() => {
    // Set first store as default when stores load
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, selectedStore]);
  
  // Load available products for the selected store
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedStore) return;
      
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('id, nombre')
          .order('nombre');
          
        if (error) throw error;
        
        setAvailableProducts(data || []);
        
        // Select first few products by default if none selected
        if (selectedProducts.length === 0 && data && data.length > 0) {
          // Select up to 3 products by default
          const initialProducts = data.slice(0, 3).map(p => p.id);
          setSelectedProducts(initialProducts);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Error al cargar productos");
      }
    };
    
    fetchProducts();
  }, [selectedStore]);
  
  // Fetch sales data when selections change
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedStore || selectedProducts.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const trendsData = await fetchItemSalesTrend(timeRange, selectedStore, selectedProducts);
        setData(trendsData);
      } catch (error) {
        console.error("Error fetching item sales trend:", error);
        toast.error("Error al cargar tendencia de ventas por ítem");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, selectedStore, selectedProducts]);
  
  // Add a product to selected products
  const handleAddProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) return;
    if (selectedProducts.length >= 6) {
      toast.warning("Máximo 6 productos para comparar");
      return;
    }
    setSelectedProducts([...selectedProducts, productId]);
  };
  
  // Remove a product from selected products
  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId));
  };
  
  // Get product name by ID
  const getProductName = (productId: string) => {
    return availableProducts.find(p => p.id === productId)?.nombre || 'Producto desconocido';
  };
  
  // Get line color by index
  const getLineColor = (index: number) => {
    return COLORS[index % COLORS.length];
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <CardTitle>Tendencia de ventas por producto</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
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
            
            <Select 
              onValueChange={handleAddProduct}
              value=""
              disabled={selectedProducts.length >= 6}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Añadir producto" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts
                  .filter(p => !selectedProducts.includes(p.id))
                  .map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nombre}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Selected products chips */}
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedProducts.map((productId, index) => (
              <div 
                key={productId}
                className="flex items-center px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: `${getLineColor(index)}30`, color: getLineColor(index) }}
              >
                <span>{getProductName(productId)}</span>
                <XCircle 
                  className="ml-1 h-4 w-4 cursor-pointer" 
                  onClick={() => handleRemoveProduct(productId)}
                />
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : selectedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p className="mb-4">Selecciona al menos un producto para ver su tendencia de ventas</p>
            <Select 
              onValueChange={handleAddProduct}
              value=""
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Añadir producto" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos disponibles para los productos seleccionados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedProducts.map((productId, index) => {
                const productName = getProductName(productId);
                return (
                  <Line
                    key={productId}
                    type="monotone"
                    dataKey={productName}
                    name={productName}
                    stroke={getLineColor(index)}
                    activeDot={{ r: 8 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
