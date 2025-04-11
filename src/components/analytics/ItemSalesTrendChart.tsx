
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ItemSalesTrendDataPoint } from "@/types/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStores } from "@/hooks/useStores";

interface Props {
  data: ItemSalesTrendDataPoint[];
  loading?: boolean;
}

export function ItemSalesTrendChart({ data, loading }: Props) {
  const { stores } = useStores();
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Extraer productos únicos de los datos
  useEffect(() => {
    if (data && data.length > 0) {
      const uniqueProducts = Array.from(new Set(data.map(item => item.producto)));
      setAvailableProducts(uniqueProducts);
      if (!selectedProduct && uniqueProducts.length > 0) {
        setSelectedProduct(uniqueProducts[0]);
      }
    }
  }, [data, selectedProduct]);

  // Filtrar datos según la tienda y producto seleccionados
  useEffect(() => {
    if (!data || data.length === 0 || !selectedProduct) return;

    let filtered = [...data];

    // Filtrar por tienda si no es "todas"
    if (selectedStore !== "all") {
      filtered = filtered.filter(item => item.almacen_id === selectedStore);
    }

    // Filtrar por producto seleccionado
    filtered = filtered.filter(item => item.producto === selectedProduct);

    // Agrupar por fecha y tienda
    const groupedData: { [key: string]: any } = {};
    filtered.forEach(item => {
      const key = `${item.fecha}-${item.almacen}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          fecha: item.fecha,
          almacen: item.almacen,
          cantidad: 0
        };
      }
      groupedData[key].cantidad += Number(item.cantidad);
    });

    // Convertir a array y ordenar por fecha
    const result = Object.values(groupedData).sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    setFilteredData(result);
  }, [data, selectedStore, selectedProduct]);

  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }

  // Obtener colores únicos para cada tienda
  const getStoreColors = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    const storeColors: { [key: string]: string } = {};
    
    const uniqueStores = Array.from(new Set(filteredData.map(item => item.almacen)));
    uniqueStores.forEach((store, index) => {
      storeColors[store] = colors[index % colors.length];
    });
    
    return storeColors;
  };

  const storeColors = getStoreColors();

  // Si no hay datos disponibles después del filtrado
  if (filteredData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Tendencia de Ventas por Ítem</CardTitle>
            <div className="flex space-x-2">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar tienda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tiendas</SelectItem>
                  {stores?.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[350px]">
            <p className="text-muted-foreground">No hay datos disponibles para la selección actual</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar datos por tienda para mostrar múltiples líneas
  const uniqueStores = Array.from(new Set(filteredData.map(item => item.almacen)));

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Tendencia de Ventas por Ítem</CardTitle>
          <div className="flex space-x-2">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar tienda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tiendas</SelectItem>
                {stores?.map(store => (
                  <SelectItem key={store.id} value={store.id}>{store.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="fecha" 
              allowDuplicatedCategory={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              tickFormatter={(value: any) => `${Number(value).toFixed(1)}`}
              label={{ value: 'Cantidad vendida', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: any) => [`${Number(value).toFixed(1)}`, 'Cantidad']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
              }}
            />
            <Legend />
            
            {uniqueStores.map((store) => {
              // Filtrar datos solo para esta tienda
              const storeData = filteredData.filter(item => item.almacen === store);
              
              return (
                <Line
                  key={store}
                  type="monotone"
                  data={storeData}
                  dataKey="cantidad"
                  name={store}
                  stroke={storeColors[store]}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
