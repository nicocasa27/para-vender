
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSales } from "@/services/salesService";
import { useStores } from "@/hooks/useStores";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function DailySalesView() {
  // Estado para el almacén/tenda seleccionada y días de rango
  const [selectedStore, setSelectedStore] = React.useState<string | "all">("all");
  const [daysRange, setDaysRange] = React.useState<number>(30);

  const { stores, isLoading: loadingStores } = useStores();

  // Consultar ventas basado en filtro seleccionado
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['dailySales', selectedStore, daysRange],
    queryFn: async () => {
      // Si es "all", no filtrar por almacén. Si es un id, filtrar.
      let sales = await fetchSales(500); // Traemos muchas para filtrar en frontend
      if (selectedStore !== "all") {
        sales = sales.filter((s: any) => s.almacen_id === selectedStore);
      }
      // Filtrar por intervalo de días
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - (daysRange - 1));
      return sales.filter((s: any) => {
        const created = new Date(s.created_at);
        // Se incluye si está dentro del rango [fromDate, hoy]
        return created >= fromDate;
      });
    }
  });

  // Procesar ventas agrupadas por día en el rango
  const processedData = React.useMemo(() => {
    if (!salesData) return [];
    const salesByDay: { [key: string]: number } = {};
    for (let i = daysRange - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      salesByDay[key] = 0;
    }
    salesData.forEach((sale: any) => {
      const key = new Date(sale.created_at).toISOString().split('T')[0];
      if (salesByDay[key] !== undefined) {
        salesByDay[key] += Number(sale.total);
      }
    });
    return Object.entries(salesByDay).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      total
    }));
  }, [salesData, daysRange]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Ventas por Día</CardTitle>
        <div className="flex flex-wrap gap-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tienda</label>
            <Select
              value={selectedStore}
              onValueChange={(value) => setSelectedStore(value)}
              disabled={loadingStores}
            >
              <SelectTrigger className="min-w-[130px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Días atrás</label>
            <Input
              type="number"
              min={1}
              max={180}
              value={daysRange}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                setDaysRange(isNaN(v) || v < 1 ? 1 : v > 180 ? 180 : v);
              }}
              className="w-20"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingSales ? (
          <>
            <Skeleton className="h-[36px] w-[200px] mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  interval={Math.ceil(daysRange / 14)} // Ajusta la densidad de labels
                />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
