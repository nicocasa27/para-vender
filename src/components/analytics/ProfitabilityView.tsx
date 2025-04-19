
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  CalendarClock, 
  DollarSign, 
  Percent, 
  Store, 
  BarChart2, 
  LineChart as LineChartIcon
} from "lucide-react";
import { MarginByCategory } from "@/components/analytics/MarginByCategory";

// Definición de tipos para datos de rentabilidad
interface ProfitData {
  date: string;
  sales: number;
  costs: number;
  margin: number;
}

interface BarChartData {
  name: string;
  sales: number;
  costs: number;
  margin: number;
}

// Interfaces para los tipos de datos de Supabase
interface VentaData {
  created_at: string;
  almacen_id: string;
}

interface ProductoData {
  precio_compra: number;
}

interface DetalleVentaItem {
  id: string;
  cantidad: number;
  precio_unitario: number;
  producto_id: string;
  productos?: ProductoData;
  ventas?: VentaData;
}

export function ProfitabilityView() {
  // Estados para los filtros y toggles
  const [period, setPeriod] = useState<string>("week");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("category");
  const [showPercentage, setShowPercentage] = useState<boolean>(false);
  const [stores, setStores] = useState<{id: string, nombre: string}[]>([]);
  
  // Estados para los datos
  const [trendData, setTrendData] = useState<ProfitData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar lista de tiendas
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('almacenes')
          .select('id, nombre');
          
        if (error) throw error;
        
        setStores(data || []);
      } catch (error) {
        console.error("Error al cargar tiendas:", error);
        toast.error("No se pudieron cargar las tiendas");
      }
    };
    
    fetchStores();
    
    // Recuperar filtros guardados
    const savedPeriod = localStorage.getItem('profitability_period');
    const savedStore = localStorage.getItem('profitability_store');
    const savedGroupBy = localStorage.getItem('profitability_groupBy');
    const savedShowPercentage = localStorage.getItem('profitability_showPercentage');
    
    if (savedPeriod) setPeriod(savedPeriod);
    if (savedStore) setSelectedStore(savedStore);
    if (savedGroupBy) setGroupBy(savedGroupBy);
    if (savedShowPercentage) setShowPercentage(savedShowPercentage === 'true');
    
  }, []);
  
  // Guardar filtros cuando cambien
  useEffect(() => {
    localStorage.setItem('profitability_period', period);
    localStorage.setItem('profitability_store', selectedStore);
    localStorage.setItem('profitability_groupBy', groupBy);
    localStorage.setItem('profitability_showPercentage', showPercentage.toString());
  }, [period, selectedStore, groupBy, showPercentage]);
  
  // Cargar datos de evolución del margen bruto
  useEffect(() => {
    const fetchTrendData = async () => {
      setIsLoading(true);
      try {
        // Calcular rango de fechas basado en el período seleccionado
        const endDate = new Date();
        let startDate = new Date();
        let interval: 'day' | 'week' | 'month' = 'day';
        
        switch (period) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            interval = 'day';
            break;
          case 'month':
            startDate.setDate(endDate.getDate() - 30);
            interval = 'day';
            break;
          case 'year':
            startDate.setMonth(endDate.getMonth() - 12);
            interval = 'month';
            break;
          default:
            startDate.setDate(endDate.getDate() - 7);
            interval = 'day';
        }
        
        // Consulta para obtener ventas agrupadas por fecha
        let query = supabase
          .from('detalles_venta')
          .select(`
            id,
            cantidad,
            precio_unitario,
            producto_id,
            productos:producto_id(precio_compra),
            ventas:venta_id(created_at, almacen_id)
          `)
          .gte('ventas.created_at', startDate.toISOString())
          .lte('ventas.created_at', endDate.toISOString());
          
        if (selectedStore !== 'all') {
          query = query.eq('ventas.almacen_id', selectedStore);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setTrendData([]);
          setIsLoading(false);
          return;
        }
        
        // Procesar datos para crear la serie temporal
        const dailyData: Record<string, {sales: number, costs: number}> = {};
        
        data.forEach((item: DetalleVentaItem) => {
          // Verificar que ventas existe y contiene created_at
          if (!item.ventas || typeof item.ventas !== 'object') return;
          
          const date = new Date(item.ventas.created_at);
          let dateKey: string;
          
          if (interval === 'day') {
            dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          } else {
            dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          }
          
          if (!dailyData[dateKey]) {
            dailyData[dateKey] = { sales: 0, costs: 0 };
          }
          
          const venta = Number(item.cantidad) * Number(item.precio_unitario);
          // Verificar que productos existe y contiene precio_compra
          const precio_compra = item.productos && typeof item.productos === 'object' ? 
            Number(item.productos.precio_compra) || 0 : 0;
          const costo = Number(item.cantidad) * precio_compra;
          
          dailyData[dateKey].sales += venta;
          dailyData[dateKey].costs += costo;
        });
        
        // Convertir a formato para gráfica
        const chartData: ProfitData[] = Object.entries(dailyData)
          .map(([date, values]) => {
            const margin = values.sales > 0 
              ? ((values.sales - values.costs) / values.sales) * 100 
              : 0;
              
            return {
              date,
              sales: Number(values.sales.toFixed(2)),
              costs: Number(values.costs.toFixed(2)),
              margin: Number(margin.toFixed(2))
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setTrendData(chartData);
      } catch (error) {
        console.error("Error al cargar datos de rentabilidad:", error);
        toast.error("Error al cargar datos de rentabilidad");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrendData();
  }, [period, selectedStore]);
  
  // Renderizar períodos en formato amigable
  const formatPeriodLabel = (period: string) => {
    switch (period) {
      case 'week': return 'Última semana';
      case 'month': return 'Último mes';
      case 'year': return 'Último año';
      default: return 'Período personalizado';
    }
  };
  
  // Renderizar fechas en formato amigable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (period === 'year') {
      // Para año, mostramos solo el mes
      return new Intl.DateTimeFormat('es', { month: 'short' }).format(date);
    } else {
      // Para semana o mes, mostramos día/mes
      return new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit' }).format(date);
    }
  };
  
  // Renderizar valores con el formato correcto (porcentaje o absoluto)
  const formatValue = (value: number, isPercentage: boolean = false) => { 
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return `$${value.toFixed(2)}`;
  };
  
  // Renderizar tooltip personalizado para la gráfica de línea
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-indigo-600">
            Ventas: ${payload[0].value.toFixed(2)}
          </p>
          <p className="text-emerald-600">
            Costos: ${payload[1].value.toFixed(2)}
          </p>
          <p className="text-amber-600">
            Margen: {payload[2].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selector de período */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Período
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector de sucursal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Sucursal
              </Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector de agrupación */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Agrupar por
              </Label>
              <ToggleGroup type="single" value={groupBy} onValueChange={(value) => value && setGroupBy(value)}>
                <ToggleGroupItem value="category" className="flex-1">
                  Categoría
                </ToggleGroupItem>
                <ToggleGroupItem value="product" className="flex-1">
                  Producto
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {/* Toggle para porcentajes/valores */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Mostrar como
              </Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Valores</span>
                <Switch 
                  checked={showPercentage} 
                  onCheckedChange={setShowPercentage} 
                />
                <span className="text-sm flex items-center">
                  <Percent className="h-3 w-3 mr-1" />
                  Porcentajes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Gráfica de barras con ventas vs costos por categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Ventas vs Costos por {groupBy === 'category' ? 'Categoría' : 'Producto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarginByCategory 
            storeId={selectedStore === 'all' ? null : selectedStore} 
            period={period}
          />
        </CardContent>
      </Card>
      
      {/* Gráfica de línea con evolución del margen bruto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Evolución del Margen Bruto - {formatPeriodLabel(period)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : trendData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No hay datos disponibles para el período seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sales" 
                  name="Ventas" 
                  stroke="#6366f1" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="costs" 
                  name="Costos" 
                  stroke="#10b981" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="margin" 
                  name="Margen (%)" 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
