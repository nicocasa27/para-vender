
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchNonSellingProducts } from "@/services/analyticService";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { useStores } from "@/hooks/useStores";

export function ProductsNotSoldChart() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { stores, isLoading: storesLoading } = useStores();
  
  // Define colors for the chart based on change percentage
  const getBarColor = (change: number) => {
    if (change <= -50) return "#ef4444"; // Strong negative (red)
    if (change <= -20) return "#f97316"; // Moderate negative (orange)
    return "#eab308"; // Mild negative (yellow)
  };
  
  // Sort the data from worst to best (most negative change first)
  const sortedData = [...data].sort((a, b) => a.change - b.change);
  
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
        const nonSellingProducts = await fetchNonSellingProducts(timeRange, selectedStore);
        setData(nonSellingProducts);
      } catch (error) {
        console.error("Error fetching non-selling products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, selectedStore]);
  
  const formatChange = (change: number) => {
    const value = Number(change);
    if (isNaN(value)) return <Minus className="h-4 w-4" />;
    
    if (value < 0) {
      return (
        <span className="flex items-center text-red-500">
          <ChevronDown className="h-4 w-4 mr-1" />
          {Math.abs(value)}%
        </span>
      );
    } else if (value > 0) {
      return (
        <span className="flex items-center text-green-500">
          <ChevronUp className="h-4 w-4 mr-1" />
          {value}%
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          0%
        </span>
      );
    }
  };
  
  // Custom tooltip to show more detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium text-gray-900">{item.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Período actual:</span> {item.current} unidades
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Período anterior:</span> {item.previous} unidades
          </p>
          <p className={`text-sm font-medium ${item.change < 0 ? 'text-red-500' : 'text-green-500'}`}>
            Cambio: {typeof item.change === 'number' ? `${item.change.toFixed(1)}%` : 'N/A'}
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
            <CardTitle>Productos con menor desempeño</CardTitle>
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
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `${value}%`}
                domain={['dataMin', 0]}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="change"
                name="Cambio en ventas (%)"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.change)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
