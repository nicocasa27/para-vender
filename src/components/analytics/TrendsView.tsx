
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  BarChart,
  Bar
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addDays, format, subDays, subMonths, isAfter, isBefore, differenceInDays } from "date-fns";
import { 
  ArrowDown, 
  ArrowUp, 
  Calendar, 
  FileDown, 
  Percent, 
  TrendingDown, 
  TrendingUp, 
  Clock,
  BarChart as BarChartIcon
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Definición de tipos para los datos
interface SalesData {
  date: string;
  sales: number;
  trend?: number;
  prediction?: number;
  lower?: number;
  upper?: number;
  actual?: number;
}

interface ProductTrend {
  id: string;
  name: string;
  currentTrend: number;
  previousValue: number;
  currentValue: number;
  percentageChange: number;
  category: string;
}

export function TrendsView() {
  // Referencias para la exportación a PDF
  const salesChartRef = useRef<HTMLDivElement>(null);
  const productsChartRef = useRef<HTMLDivElement>(null);
  
  // Estados para filtros y datos
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 3),
    to: new Date()
  });
  const [confidenceLevel, setConfidenceLevel] = useState<string>("75");
  const [timeAggregation, setTimeAggregation] = useState<string>("weekly");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{id: string, nombre: string}[]>([]);
  const [activeTab, setActiveTab] = useState<string>("salesPrediction");
  
  // Estados para los datos
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productTrends, setProductTrends] = useState<ProductTrend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  
  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nombre');
          
        if (error) throw error;
        
        setCategories(data || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast.error("No se pudieron cargar las categorías");
      }
    };
    
    fetchCategories();
    
    // Recuperar filtros guardados
    const savedConfidenceLevel = localStorage.getItem('trends_confidenceLevel');
    const savedTimeAggregation = localStorage.getItem('trends_timeAggregation');
    const savedCategory = localStorage.getItem('trends_category');
    
    if (savedConfidenceLevel) setConfidenceLevel(savedConfidenceLevel);
    if (savedTimeAggregation) setTimeAggregation(savedTimeAggregation);
    if (savedCategory) setSelectedCategory(savedCategory);
    
  }, []);
  
  // Guardar filtros cuando cambien
  useEffect(() => {
    localStorage.setItem('trends_confidenceLevel', confidenceLevel);
    localStorage.setItem('trends_timeAggregation', timeAggregation);
    localStorage.setItem('trends_category', selectedCategory);
  }, [confidenceLevel, timeAggregation, selectedCategory]);
  
  // Cargar datos históricos de ventas cuando cambian los filtros
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    const fetchHistoricalSales = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('ventas')
          .select(`
            id,
            total,
            created_at,
            detalles_venta!inner(
              producto_id,
              productos!inner(
                id,
                nombre,
                categoria_id
              )
            )
          `)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
          
        if (selectedCategory !== 'all') {
          query = query.eq('detalles_venta.productos.categoria_id', selectedCategory);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setIsLoading(false);
          setSalesData([]);
          setProductTrends([]);
          return;
        }
        
        // Procesar datos de ventas para agruparlos por período
        const salesByDate: Record<string, number> = {};
        const productSales: Record<string, {name: string, category: string, values: Record<string, number>}> = {};
        
        // Agrupar ventas por fecha y producto
        data.forEach(sale => {
          const saleDate = new Date(sale.created_at);
          let dateKey: string;
          
          // Formatear fecha según la agregación seleccionada
          switch (timeAggregation) {
            case 'daily':
              dateKey = format(saleDate, 'yyyy-MM-dd');
              break;
            case 'weekly':
              // Usar el lunes como inicio de semana
              const day = saleDate.getDay() || 7; // Convertir 0 (domingo) a 7
              const mondayDate = new Date(saleDate);
              mondayDate.setDate(saleDate.getDate() - day + 1);
              dateKey = format(mondayDate, 'yyyy-MM-dd');
              break;
            case 'monthly':
              dateKey = format(saleDate, 'yyyy-MM');
              break;
            default:
              dateKey = format(saleDate, 'yyyy-MM-dd');
          }
          
          // Acumular ventas por fecha
          if (!salesByDate[dateKey]) {
            salesByDate[dateKey] = 0;
          }
          salesByDate[dateKey] += Number(sale.total);
          
          // Acumular ventas por producto
          if (sale.detalles_venta) {
            sale.detalles_venta.forEach((detalle: any) => {
              if (detalle.productos) {
                const productId = detalle.productos.id;
                const productName = detalle.productos.nombre;
                const categoryId = detalle.productos.categoria_id;
                
                if (!productSales[productId]) {
                  productSales[productId] = {
                    name: productName,
                    category: categoryId,
                    values: {}
                  };
                }
                
                if (!productSales[productId].values[dateKey]) {
                  productSales[productId].values[dateKey] = 0;
                }
                
                // Asumimos que cada detalle tiene cantidad y precio_unitario
                productSales[productId].values[dateKey] += 
                  Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0);
              }
            });
          }
        });
        
        // Convertir a formato para gráfica y calcular tendencias
        const sortedDates = Object.keys(salesByDate).sort();
        const processedSalesData: SalesData[] = sortedDates.map((date, index) => {
          // Calcular la tendencia usando una media móvil simple de 3 períodos
          let trend = salesByDate[date];
          if (index >= 2) {
            trend = (salesByDate[sortedDates[index-2]] + 
                    salesByDate[sortedDates[index-1]] + 
                    salesByDate[date]) / 3;
          }
          
          return {
            date,
            sales: Number(salesByDate[date].toFixed(2)),
            trend: Number(trend.toFixed(2))
          };
        });
        
        // Procesar tendencias de productos
        const productTrendsData: ProductTrend[] = [];
        
        Object.entries(productSales).forEach(([productId, data]) => {
          const dateValues = Object.entries(data.values)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
          
          if (dateValues.length < 2) return; // Necesitamos al menos dos puntos para calcular tendencia
          
          // Dividir en mitades para comparar
          const midpoint = Math.floor(dateValues.length / 2);
          const firstHalf = dateValues.slice(0, midpoint);
          const secondHalf = dateValues.slice(midpoint);
          
          // Calcular promedios de cada mitad
          const firstHalfAvg = firstHalf.reduce((sum, [_, value]) => sum + value, 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, [_, value]) => sum + value, 0) / secondHalf.length;
          
          // Calcular porcentaje de cambio
          const percentageChange = secondHalfAvg === 0 
            ? 0 
            : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
          
          // Obtener último valor y valor anterior
          const lastValue = dateValues[dateValues.length - 1][1];
          const previousValue = dateValues[dateValues.length - 2] 
            ? dateValues[dateValues.length - 2][1] 
            : 0;
            
          // Solo añadir si hay un cambio significativo (> 5%)
          if (Math.abs(percentageChange) > 5) {
            productTrendsData.push({
              id: productId,
              name: data.name,
              currentTrend: percentageChange,
              previousValue,
              currentValue: lastValue,
              percentageChange,
              category: data.category
            });
          }
        });
        
        // Ordenar productos por cambio porcentual (descendente)
        productTrendsData.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
        
        setSalesData(processedSalesData);
        setProductTrends(productTrendsData.slice(0, 10)); // Top 10
        
      } catch (error) {
        console.error("Error al cargar datos de ventas:", error);
        toast.error("Error al cargar datos de ventas históricas");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalSales();
  }, [dateRange, timeAggregation, selectedCategory]);
  
  // Generar predicciones cuando cambian los datos o el nivel de confianza
  useEffect(() => {
    if (salesData.length < 5) return; // Necesitamos suficientes datos para predecir
    
    const generatePredictions = () => {
      setIsPredicting(true);
      
      try {
        // Copiar datos originales
        const dataWithPredictions = [...salesData];
        
        // Calcular estadísticas básicas de los datos históricos
        const historicalValues = dataWithPredictions.map(d => d.sales);
        const avgSales = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
        const stdDev = Math.sqrt(
          historicalValues.reduce((sum, val) => sum + Math.pow(val - avgSales, 2), 0) / historicalValues.length
        );
        
        // Calcular factor de confianza basado en el nivel seleccionado
        let confidenceFactor = 1.0;
        switch (confidenceLevel) {
          case "60":
            confidenceFactor = 0.84;
            break;
          case "75":
            confidenceFactor = 1.15;
            break;
          case "90":
            confidenceFactor = 1.64;
            break;
          default:
            confidenceFactor = 1.15; // 75% por defecto
        }
        
        // Calcular tendencia usando regresión lineal simple
        const n = historicalValues.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
          sumX += i;
          sumY += historicalValues[i];
          sumXY += i * historicalValues[i];
          sumX2 += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Fecha del último dato histórico
        const lastDate = new Date(dataWithPredictions[dataWithPredictions.length - 1].date);
        
        // Generar predicciones para los próximos 30 días
        for (let i = 1; i <= 30; i++) {
          let nextDate: Date;
          
          // Calcular la siguiente fecha según la agregación de tiempo
          switch (timeAggregation) {
            case 'daily':
              nextDate = addDays(lastDate, i);
              break;
            case 'weekly':
              nextDate = addDays(lastDate, i * 7);
              break;
            case 'monthly':
              // Para mensual simplemente añadimos un mes más
              const newDate = new Date(lastDate);
              newDate.setMonth(lastDate.getMonth() + i);
              nextDate = newDate;
              break;
            default:
              nextDate = addDays(lastDate, i);
          }
          
          // Calcular predicción usando el modelo lineal
          const prediction = intercept + slope * (n + i - 1);
          
          // Añadir margen de error basado en desviación estándar y nivel de confianza
          const margin = stdDev * confidenceFactor;
          
          let dateKey: string;
          if (timeAggregation === 'monthly') {
            dateKey = format(nextDate, 'yyyy-MM');
          } else {
            dateKey = format(nextDate, 'yyyy-MM-dd');
          }
          
          // Añadir punto de predicción con límites superior e inferior
          dataWithPredictions.push({
            date: dateKey,
            sales: 0,
            prediction: Math.max(0, Number(prediction.toFixed(2))),
            lower: Math.max(0, Number((prediction - margin).toFixed(2))),
            upper: Number((prediction + margin).toFixed(2))
          });
        }
        
        // Actualizar los datos
        setSalesData(dataWithPredictions);
      } catch (error) {
        console.error("Error al generar predicciones:", error);
        toast.error("Error al generar predicciones de ventas");
      } finally {
        setIsPredicting(false);
      }
    };
    
    generatePredictions();
  }, [salesData.length, confidenceLevel]);
  
  // Función para formatear fechas según la agregación de tiempo
  const formatDateLabel = (dateStr: string) => {
    try {
      if (timeAggregation === 'monthly' && dateStr.length === 7) {
        // Formato YYYY-MM para datos mensuales
        const [year, month] = dateStr.split('-');
        return `${month}/${year.slice(2)}`;
      } else {
        const date = new Date(dateStr);
        
        switch (timeAggregation) {
          case 'daily':
            return format(date, 'dd/MM');
          case 'weekly':
            return `Sem ${format(date, 'dd/MM')}`;
          default:
            return format(date, 'dd/MM');
        }
      }
    } catch (e) {
      console.error("Error al formatear fecha:", e);
      return dateStr;
    }
  };
  
  // Custom Tooltip para gráfica de ventas y predicciones
  const SalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedDate = formatDateLabel(label);
      
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{formattedDate}</p>
          {payload[0]?.value !== undefined && payload[0]?.value !== 0 && (
            <p className="text-blue-600">
              Ventas: ${payload[0].value.toFixed(2)}
            </p>
          )}
          {payload[1]?.value !== undefined && (
            <p className="text-green-600">
              Tendencia: ${payload[1].value.toFixed(2)}
            </p>
          )}
          {payload[2]?.value !== undefined && (
            <p className="text-purple-600">
              Predicción: ${payload[2].value.toFixed(2)}
            </p>
          )}
          {payload[3]?.value !== undefined && payload[4]?.value !== undefined && (
            <p className="text-muted-foreground text-xs">
              Intervalo de confianza: ${payload[3].value.toFixed(2)} - ${payload[4].value.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Exportar a PDF
  const exportToPDF = async () => {
    if (!salesChartRef.current || !productsChartRef.current) {
      toast.error("No se pudieron generar los gráficos para el PDF");
      return;
    }
    
    try {
      toast.info("Generando PDF, por favor espere...");
      
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Configurar título y encabezado
      pdf.setFontSize(18);
      pdf.text('Reporte de Tendencias', 14, 15);
      
      // Agregar fecha
      pdf.setFontSize(10);
      pdf.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
      
      // Agregar periodo analizado
      if (dateRange?.from && dateRange?.to) {
        pdf.text(`Período analizado: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`, 14, 28);
      }
      
      // Agregar nivel de confianza
      pdf.text(`Nivel de confianza: ${confidenceLevel}%`, 14, 34);
      
      // Obtener captura de la gráfica de ventas
      const salesCanvas = await html2canvas(salesChartRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      const salesImgData = salesCanvas.toDataURL('image/png');
      
      // Agregar la gráfica de ventas al PDF
      pdf.text('Predicción de Ventas', 14, 45);
      pdf.addImage(salesImgData, 'PNG', 14, 48, 270, 90);
      
      // Obtener captura de la gráfica de productos
      const productsCanvas = await html2canvas(productsChartRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      const productsImgData = productsCanvas.toDataURL('image/png');
      
      // Agregar la gráfica de productos al PDF
      pdf.text('Productos con Tendencias', 14, 145);
      pdf.addImage(productsImgData, 'PNG', 14, 148, 270, 90);
      
      // Guardar el PDF
      pdf.save(`Reporte_Tendencias_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      
      toast.success("PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selector de rango de fechas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rango de fechas
              </Label>
              <DatePickerWithRange 
                date={dateRange} 
                onDateChange={setDateRange} 
              />
            </div>
            
            {/* Selector de categoría */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BarChartIcon className="h-4 w-4" />
                Categoría
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector de nivel de confianza */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Nivel de confianza
              </Label>
              <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel de confianza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector de agregación de tiempo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Agregación de tiempo
              </Label>
              <Select value={timeAggregation} onValueChange={setTimeAggregation}>
                <SelectTrigger>
                  <SelectValue placeholder="Agregación de tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Botón de exportar a PDF */}
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline"
              onClick={exportToPDF}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Pestañas para diferentes vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="salesPrediction" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Predicción de Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="productTrends" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span>Tendencias de Productos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="salesPrediction">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predicción de Ventas para los Próximos 30 Días
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={salesChartRef}>
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : salesData.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No hay suficientes datos disponibles para generar predicciones
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDateLabel}
                        minTickGap={30}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip content={<SalesTooltip />} />
                      <Legend />
                      
                      {/* Referencia para separar datos históricos y predicciones */}
                      <ReferenceLine
                        x={salesData.findIndex(d => d.prediction !== undefined && d.sales === 0)}
                        stroke="#666"
                        strokeDasharray="3 3"
                        label={{ value: 'Predicción', position: 'insideTopLeft' }}
                      />
                      
                      {/* Área para intervalo de confianza */}
                      <Area
                        type="monotone"
                        dataKey="lower"
                        name="Límite Inferior"
                        stroke="transparent"
                        fill="#8884d8"
                        fillOpacity={0.1}
                        activeDot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="upper"
                        name="Límite Superior"
                        stroke="transparent"
                        fill="#8884d8"
                        fillOpacity={0.1}
                        activeDot={false}
                      />
                      
                      {/* Líneas para datos reales y predicciones */}
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Ventas Reales"
                        stroke="#8884d8"
                        dot={{ strokeWidth: 1, r: 2 }}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="trend"
                        name="Tendencia"
                        stroke="#82ca9d"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="prediction"
                        name="Predicción"
                        stroke="#ff7300"
                        strokeDasharray="5 5"
                        dot={{ strokeWidth: 1, r: 2 }}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  <p className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-blue-500 mr-2 rounded-sm"></span>
                    Ventas reales: Datos históricos de ventas
                  </p>
                  <p className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-orange-500 mr-2 rounded-sm"></span>
                    Predicción: Estimación de ventas futuras (nivel de confianza: {confidenceLevel}%)
                  </p>
                  <p className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-purple-200 mr-2 rounded-sm"></span>
                    Área sombreada: Rango de confianza de la predicción
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="productTrends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Productos con Tendencias Significativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={productsChartRef}>
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : productTrends.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No hay productos con tendencias significativas en el período seleccionado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={productTrends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                      />
                      <YAxis 
                        dataKey="name"
                        type="category"
                        width={150}
                        tick={{fontSize: 12}}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toFixed(2)}%`, 'Variación']}
                        labelFormatter={(value) => `Producto: ${value}`}
                      />
                      <Bar 
                        dataKey="percentageChange" 
                        name="Variación" 
                        fill={(entry: any) => entry.percentageChange >= 0 ? "#82ca9d" : "#ff7782"}
                      >
                        {productTrends.map((entry, index) => (
                          <g key={`trend-indicator-${index}`}>
                            {entry.percentageChange > 0 ? (
                              <ArrowUp
                                x={5}
                                y={index * 40 + 20}
                                width={16}
                                height={16}
                                className="text-green-500"
                              />
                            ) : (
                              <ArrowDown
                                x={5}
                                y={index * 40 + 20}
                                width={16}
                                height={16}
                                className="text-red-500"
                              />
                            )}
                          </g>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  <p className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-500 mr-2 rounded-sm"></span>
                    Tendencia al alza: Productos que están incrementando sus ventas
                  </p>
                  <p className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-red-500 mr-2 rounded-sm"></span>
                    Tendencia a la baja: Productos que están disminuyendo sus ventas
                  </p>
                  <p>
                    El porcentaje indica la variación en el período seleccionado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
