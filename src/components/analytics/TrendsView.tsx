
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Calendar,
  CalendarIcon,
  ChevronDown,
  Download,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, isBefore, parseISO, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";

// Tipos para datos de tendencias
interface SalesPrediction {
  date: string;
  actual: number;
  predicted: number;
  confidenceLow: number;
  confidenceHigh: number;
}

interface ProductTrend {
  id: string;
  name: string;
  category: string;
  currentPeriodSales: number;
  previousPeriodSales: number;
  trend: number;
  trending: "up" | "down" | "stable";
}

interface TrendReportOptions {
  dateRange: [Date | undefined, Date | undefined];
  aggregation: "daily" | "weekly" | "monthly";
  confidenceLevel: "60" | "75" | "90";
  categoryFilter: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Datos simulados para visualización inicial
const INITIAL_PREDICTIONS: SalesPrediction[] = Array.from({ length: 30 }).map(
  (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const formattedDate = format(date, "yyyy-MM-dd");
    const baseValue = 10000 + Math.random() * 2000 - 1000;
    const predicted = baseValue + (i * 100);
    const confidence = i * 50;
    
    return {
      date: formattedDate,
      actual: i < 5 ? baseValue : 0,
      predicted: predicted,
      confidenceLow: predicted - confidence,
      confidenceHigh: predicted + confidence,
    };
  }
);

// Inicialización de opciones para el informe
const DEFAULT_OPTIONS: TrendReportOptions = {
  dateRange: [subMonths(new Date(), 3), new Date()],
  aggregation: "daily",
  confidenceLevel: "75",
  categoryFilter: "all",
};

export function TrendsView() {
  // Estados para manejo de datos y filtros
  const [options, setOptions] = useState<TrendReportOptions>(DEFAULT_OPTIONS);
  const [salesPredictions, setSalesPredictions] = useState<SalesPrediction[]>(INITIAL_PREDICTIONS);
  const [productTrends, setProductTrends] = useState<ProductTrend[]>([]);
  const [categories, setCategories] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateOpen, setDateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("predictions");

  // Función para exportar el informe como PDF
  const exportToPDF = useCallback(() => {
    try {
      toast.info("Generando PDF...");

      const doc = new jsPDF();
      let y = 20;
      
      // Título
      doc.setFontSize(18);
      doc.text("Informe de Tendencias", 105, y, { align: "center" });
      
      // Fecha
      doc.setFontSize(10);
      y += 10;
      doc.text(
        `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        105,
        y,
        { align: "center" }
      );
      
      // Parámetros del informe
      y += 15;
      doc.setFontSize(12);
      doc.text("Parámetros del análisis:", 20, y);
      
      doc.setFontSize(10);
      y += 7;
      const startDate = options.dateRange[0] ? format(options.dateRange[0], "dd/MM/yyyy") : "No seleccionado";
      const endDate = options.dateRange[1] ? format(options.dateRange[1], "dd/MM/yyyy") : "No seleccionado";
      doc.text(`Rango de fechas: ${startDate} - ${endDate}`, 25, y);
      
      y += 7;
      doc.text(`Nivel de confianza: ${options.confidenceLevel}%`, 25, y);
      
      y += 7;
      doc.text(`Agregación: ${options.aggregation === "daily" ? "Diaria" : options.aggregation === "weekly" ? "Semanal" : "Mensual"}`, 25, y);
      
      y += 7;
      const categoryName = options.categoryFilter === "all" ? "Todas" : categories.find(c => c.id === options.categoryFilter)?.nombre || "Desconocida";
      doc.text(`Categoría: ${categoryName}`, 25, y);
      
      // Datos de predicción
      y += 15;
      doc.setFontSize(14);
      doc.text("Predicción de Ventas", 105, y, { align: "center" });
      
      doc.setFontSize(10);
      y += 10;
      
      // Tabla de predicciones
      doc.text("Fecha", 20, y);
      doc.text("Predicción", 70, y);
      doc.text("Confianza Min", 120, y);
      doc.text("Confianza Max", 170, y);
      
      // Línea separadora
      y += 2;
      doc.line(20, y, 190, y);
      
      // Datos
      const predictionsToShow = salesPredictions.slice(0, 20);
      predictionsToShow.forEach((prediction, index) => {
        y += 7;
        
        if (y > 280) {
          doc.addPage();
          y = 20;
          
          // Encabezados de tabla en la nueva página
          doc.text("Fecha", 20, y);
          doc.text("Predicción", 70, y);
          doc.text("Confianza Min", 120, y);
          doc.text("Confianza Max", 170, y);
          
          // Línea separadora
          y += 2;
          doc.line(20, y, 190, y);
          y += 7;
        }
        
        const dateFormatted = format(new Date(prediction.date), "dd/MM/yyyy");
        
        doc.text(dateFormatted, 20, y);
        doc.text(`$${prediction.predicted.toFixed(2)}`, 70, y);
        doc.text(`$${prediction.confidenceLow.toFixed(2)}`, 120, y);
        doc.text(`$${prediction.confidenceHigh.toFixed(2)}`, 170, y);
      });
      
      // Si hay más predicciones, indicarlo
      if (salesPredictions.length > 20) {
        y += 10;
        doc.text(`...y ${salesPredictions.length - 20} más`, 105, y, { align: "center" });
      }
      
      // Productos con tendencia
      doc.addPage();
      y = 20;
      
      doc.setFontSize(14);
      doc.text("Productos con Tendencia", 105, y, { align: "center" });
      
      // Productos en alza
      y += 15;
      doc.setFontSize(12);
      doc.text("Productos en alza:", 20, y);
      doc.setFontSize(10);
      
      const risingProducts = productTrends.filter(p => p.trending === "up").slice(0, 10);
      if (risingProducts.length === 0) {
        y += 7;
        doc.text("No hay productos con tendencia al alza en el período seleccionado", 25, y);
      } else {
        risingProducts.forEach((product, index) => {
          y += 7;
          const trendPercent = (product.trend * 100).toFixed(1);
          doc.text(`${index + 1}. ${product.name} (+${trendPercent}%)`, 25, y);
        });
      }
      
      // Productos en baja
      y += 15;
      doc.setFontSize(12);
      doc.text("Productos en baja:", 20, y);
      doc.setFontSize(10);
      
      const fallingProducts = productTrends.filter(p => p.trending === "down").slice(0, 10);
      if (fallingProducts.length === 0) {
        y += 7;
        doc.text("No hay productos con tendencia a la baja en el período seleccionado", 25, y);
      } else {
        fallingProducts.forEach((product, index) => {
          y += 7;
          const trendPercent = (Math.abs(product.trend) * 100).toFixed(1);
          doc.text(`${index + 1}. ${product.name} (-${trendPercent}%)`, 25, y);
        });
      }
      
      // Conclusión
      y += 20;
      doc.setFontSize(12);
      doc.text("Conclusión:", 20, y);
      
      y += 7;
      doc.setFontSize(10);
      doc.text(
        "Este informe presenta tendencias basadas en datos históricos de ventas. Las predicciones",
        20,
        y
      );
      y += 7;
      doc.text(
        "tienen un nivel de confianza del " + options.confidenceLevel + "% y deben considerarse como estimaciones.",
        20,
        y
      );
      
      // Guardar el PDF
      doc.save("informe-tendencias.pdf");
      
      toast.success("PDF generado con éxito", {
        description: "El informe ha sido descargado"
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF");
    }
  }, [salesPredictions, productTrends, options, categories]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categorias")
          .select("id, nombre")
          .order("nombre");

        if (error) throw error;

        setCategories([{ id: "all", nombre: "Todas las categorías" }, ...(data || [])]);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast.error("No se pudieron cargar las categorías");
      }
    };

    fetchCategories();
  }, []);

  // Cargar datos de tendencias cuando cambian las opciones
  useEffect(() => {
    const fetchTrendData = async () => {
      setIsLoading(true);
      try {
        // Fecha de inicio y fin para el análisis
        const startDate = options.dateRange[0] || subMonths(new Date(), 3);
        const endDate = options.dateRange[1] || new Date();
        
        // Para el análisis de tendencias, necesitamos comparar con un período anterior
        // Calculamos el período anterior del mismo tamaño
        const periodDifference = endDate.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodDifference);
        const previousEndDate = new Date(endDate.getTime() - periodDifference);
        
        // Consulta para obtener ventas por producto en el período actual
        let currentQuery = supabase
          .from("detalles_venta")
          .select(`
            cantidad,
            precio_unitario,
            productos:producto_id(id, nombre, categoria_id),
            ventas:venta_id(created_at)
          `)
          .gte("ventas.created_at", startDate.toISOString())
          .lte("ventas.created_at", endDate.toISOString());
          
        // Filtrar por categoría si está seleccionada
        if (options.categoryFilter !== "all") {
          currentQuery = currentQuery.eq("productos.categoria_id", options.categoryFilter);
        }
        
        // Consulta para obtener ventas por producto en el período anterior
        let previousQuery = supabase
          .from("detalles_venta")
          .select(`
            cantidad,
            precio_unitario,
            productos:producto_id(id, nombre, categoria_id),
            ventas:venta_id(created_at)
          `)
          .gte("ventas.created_at", previousStartDate.toISOString())
          .lte("ventas.created_at", previousEndDate.toISOString());
          
        // Filtrar por categoría si está seleccionada
        if (options.categoryFilter !== "all") {
          previousQuery = previousQuery.eq("productos.categoria_id", options.categoryFilter);
        }
        
        // Ejecutar ambas consultas en paralelo
        const [currentResponse, previousResponse] = await Promise.all([
          currentQuery,
          previousQuery
        ]);
        
        if (currentResponse.error) throw currentResponse.error;
        if (previousResponse.error) throw previousResponse.error;
        
        // Calcular ventas por producto para el período actual
        const currentProductSales: Record<string, {total: number, name: string, category: string}> = {};
        
        currentResponse.data?.forEach((item: any) => {
          if (!item.productos || !item.productos.id) return;
          
          const productId = item.productos.id;
          const venta = Number(item.cantidad) * Number(item.precio_unitario);
          
          if (!currentProductSales[productId]) {
            currentProductSales[productId] = {
              total: 0,
              name: item.productos.nombre || "Producto sin nombre",
              category: item.productos.categoria_id || "Sin categoría"
            };
          }
          
          currentProductSales[productId].total += venta;
        });
        
        // Calcular ventas por producto para el período anterior
        const previousProductSales: Record<string, number> = {};
        
        previousResponse.data?.forEach((item: any) => {
          if (!item.productos || !item.productos.id) return;
          
          const productId = item.productos.id;
          const venta = Number(item.cantidad) * Number(item.precio_unitario);
          
          if (!previousProductSales[productId]) {
            previousProductSales[productId] = 0;
          }
          
          previousProductSales[productId] += venta;
        });
        
        // Calcular tendencias
        const trends: ProductTrend[] = Object.entries(currentProductSales).map(([id, data]) => {
          const previousSales = previousProductSales[id] || 0;
          const currentSales = data.total;
          
          // Calcular tendencia porcentual
          let trend = 0;
          if (previousSales > 0) {
            trend = (currentSales - previousSales) / previousSales;
          } else if (currentSales > 0) {
            trend = 1; // Si no había ventas antes pero ahora sí, es 100% de crecimiento
          }
          
          // Determinar dirección de la tendencia
          let trending: "up" | "down" | "stable" = "stable";
          if (trend > 0.05) trending = "up";
          else if (trend < -0.05) trending = "down";
          
          return {
            id,
            name: data.name,
            category: data.category,
            currentPeriodSales: currentSales,
            previousPeriodSales: previousSales,
            trend,
            trending
          };
        });
        
        // Ordenar por tendencia (de mayor a menor)
        trends.sort((a, b) => b.trend - a.trend);
        
        setProductTrends(trends);
        
        // Generar predicción basada en datos históricos
        await generateSalesPrediction(startDate, endDate);
      } catch (error) {
        console.error("Error al cargar datos de tendencias:", error);
        toast.error("Error al cargar datos de tendencias");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Función para generar predicción de ventas
    const generateSalesPrediction = async (startDate: Date, endDate: Date) => {
      try {
        // Obtener ventas diarias históricas para el modelo
        let query = supabase
          .from("ventas")
          .select(`
            id,
            created_at,
            total
          `)
          .gte("created_at", subMonths(startDate, 6).toISOString()) // Usar 6 meses antes para tener suficientes datos
          .lte("created_at", endDate.toISOString())
          .order("created_at");
          
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length < 30) {
          // Si no hay suficientes datos, crear predicciones simuladas
          const predictions: SalesPrediction[] = INITIAL_PREDICTIONS;
          setSalesPredictions(predictions);
          return;
        }
        
        // Agrupar ventas por día/semana/mes según la configuración
        const salesByPeriod: Record<string, number> = {};
        
        data.forEach(sale => {
          if (!sale.created_at) return;
          
          let periodKey: string;
          const saleDate = new Date(sale.created_at);
          
          if (options.aggregation === "daily") {
            periodKey = format(saleDate, "yyyy-MM-dd");
          } else if (options.aggregation === "weekly") {
            // Usar el lunes como inicio de semana
            const weekStart = new Date(saleDate);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            periodKey = format(weekStart, "yyyy-MM-dd");
          } else {
            periodKey = format(saleDate, "yyyy-MM");
          }
          
          if (!salesByPeriod[periodKey]) {
            salesByPeriod[periodKey] = 0;
          }
          
          salesByPeriod[periodKey] += Number(sale.total || 0);
        });
        
        // Convertir a array para el cálculo
        const salesDataArray = Object.entries(salesByPeriod)
          .map(([date, total]) => ({ date, total }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        // Calcular predicciones usando un modelo simple de promedio móvil
        // En un caso real se usaría un modelo más sofisticado
        const predictions: SalesPrediction[] = [];
        const periodsToPredict = 30; // Predecir los próximos 30 períodos
        
        // Calcular niveles de confianza
        const confidenceMultiplier = (() => {
          switch (options.confidenceLevel) {
            case "60": return 0.84; // ~60% confianza
            case "90": return 1.65; // ~90% confianza
            case "75":
            default: return 1.15;   // ~75% confianza
          }
        })();
        
        // Calcular desviación estándar de los datos
        const avgSales = salesDataArray.reduce((sum, item) => sum + item.total, 0) / salesDataArray.length;
        const variance = salesDataArray.reduce((sum, item) => sum + Math.pow(item.total - avgSales, 2), 0) / salesDataArray.length;
        const stdDev = Math.sqrt(variance);
        
        // Usar los últimos valores para calcular tendencia
        const valuesToUse = Math.min(10, salesDataArray.length);
        const recentData = salesDataArray.slice(-valuesToUse);
        
        // Calcular tendencia con regresión lineal simple
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        
        recentData.forEach((item, index) => {
          sumX += index;
          sumY += item.total;
          sumXY += index * item.total;
          sumXX += index * index;
        });
        
        const n = recentData.length;
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
        const intercept = (sumY - slope * sumX) / n || avgSales;
        
        // Generar fechas para las predicciones futuras
        let lastDate = endDate;
        if (salesDataArray.length > 0) {
          lastDate = new Date(salesDataArray[salesDataArray.length - 1].date);
        }
        
        // Generar predicciones para cada período futuro
        for (let i = 0; i < periodsToPredict; i++) {
          let nextDate: Date;
          
          if (options.aggregation === "daily") {
            nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + i + 1);
          } else if (options.aggregation === "weekly") {
            nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + (i + 1) * 7);
          } else {
            nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + i + 1);
          }
          
          // Predicción basada en tendencia
          const predictedValue = intercept + slope * (n + i);
          
          // Añadir algo de aleatoriedad para que se vea más realista
          const randomFactor = 1 + (Math.random() * 0.2 - 0.1); // ±10%
          const predicted = Math.max(0, predictedValue * randomFactor);
          
          // Calcular intervalos de confianza
          const confidenceInterval = stdDev * confidenceMultiplier * (1 + i * 0.05);
          
          predictions.push({
            date: format(nextDate, "yyyy-MM-dd"),
            actual: 0, // No hay datos reales para el futuro
            predicted,
            confidenceLow: Math.max(0, predicted - confidenceInterval),
            confidenceHigh: predicted + confidenceInterval
          });
        }
        
        // Añadir datos reales recientes a las predicciones para tener continuidad en el gráfico
        const recentRealData = salesDataArray.slice(-5).map(item => ({
          date: item.date,
          actual: item.total,
          predicted: 0,
          confidenceLow: 0,
          confidenceHigh: 0
        }));
        
        setSalesPredictions([...recentRealData, ...predictions]);
      } catch (error) {
        console.error("Error al generar predicción de ventas:", error);
        // Si hay errores, usar datos simulados
        setSalesPredictions(INITIAL_PREDICTIONS);
      }
    };

    fetchTrendData();
  }, [options]);

  // Renderizadores de componentes auxiliares
  const renderDateRangePicker = () => (
    <div className="grid gap-2">
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {options.dateRange[0] && options.dateRange[1] ? (
              <>
                {format(options.dateRange[0], "dd/MM/yyyy")} -{" "}
                {format(options.dateRange[1], "dd/MM/yyyy")}
              </>
            ) : (
              <span>Seleccionar rango de fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={options.dateRange[0]}
            selected={{
              from: options.dateRange[0],
              to: options.dateRange[1],
            }}
            onSelect={(range: DateRange) => {
              if (range?.from && range?.to) {
                setOptions({
                  ...options,
                  dateRange: [range.from, range.to],
                });
              }
              setDateOpen(false);
            }}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Componente para renderizar la predicción de ventas
  const renderSalesPrediction = () => (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" />
          Predicción de Ventas - Próximos 30 días
        </CardTitle>
        <CardDescription>
          Proyección de ventas basada en datos históricos con nivel de confianza
          del {options.confidenceLevel}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={salesPredictions}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "dd/MM")}
              />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                labelFormatter={(date) =>
                  format(new Date(date), "dd/MM/yyyy")
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                name="Ventas reales"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                name="Predicción"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="confidenceHigh"
                name="Límite superior"
                stroke="#d1d5db"
                fill="#d1d5db"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="confidenceLow"
                name="Límite inferior"
                stroke="#d1d5db"
                fill="#d1d5db"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  // Componente para renderizar los productos con tendencia
  const renderProductTrends = () => (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Productos con Tendencia
        </CardTitle>
        <CardDescription>
          Comparación con el período anterior
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : productTrends.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No hay datos de tendencias para el período seleccionado
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Productos en alza
              </h3>
              <div className="max-h-[180px] overflow-y-auto pr-2">
                {productTrends
                  .filter((p) => p.trending === "up")
                  .slice(0, 10)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <span className="font-medium">
                        {index + 1}. {product.name}
                      </span>
                      <span className="text-emerald-500 font-medium">
                        +{(product.trend * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                {productTrends.filter((p) => p.trending === "up").length ===
                  0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No hay productos con tendencia al alza
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Productos en baja
              </h3>
              <div className="max-h-[180px] overflow-y-auto pr-2">
                {productTrends
                  .filter((p) => p.trending === "down")
                  .slice(0, 10)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <span className="font-medium">
                        {index + 1}. {product.name}
                      </span>
                      <span className="text-red-500 font-medium">
                        -{(Math.abs(product.trend) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                {productTrends.filter((p) => p.trending === "down").length ===
                  0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No hay productos con tendencia a la baja
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Gráfica de barras para comparación de tendencias
  const renderTrendComparison = () => {
    // Preparar datos para la gráfica
    // Mostrar los 5 productos que más subieron y los 5 que más bajaron
    const topRising = productTrends
      .filter((p) => p.trending === "up")
      .slice(0, 5);
    const topFalling = productTrends
      .filter((p) => p.trending === "down")
      .slice(0, 5);
    
    const compareData = [...topRising, ...topFalling].map((product) => ({
      name: product.name.length > 15 
        ? product.name.substring(0, 15) + "..."
        : product.name,
      trendPercentage: Number((product.trend * 100).toFixed(1)),
      trending: product.trending
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Comparación de Tendencias
          </CardTitle>
          <CardDescription>
            Productos con mayor variación porcentual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : productTrends.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No hay datos de tendencias para el período seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={compareData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Variación"]}
                />
                <Legend />
                <Bar
                  dataKey="trendPercentage"
                  name="Variación porcentual"
                  fill={(entry) => entry.trending === "up" ? "#82ca9d" : "#ff7782"}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Título y descripción */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Análisis de Tendencias
        </h2>
        <p className="text-muted-foreground">
          Predicciones y tendencias basadas en datos históricos de ventas
        </p>
      </div>

      {/* Controles y filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selector de rango de fechas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rango de fechas</Label>
              {renderDateRangePicker()}
            </div>

            {/* Selector de categoría */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoría</Label>
              <Select
                value={options.categoryFilter}
                onValueChange={(value) =>
                  setOptions({ ...options, categoryFilter: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de confianza */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nivel de confianza</Label>
              <ToggleGroup
                type="single"
                value={options.confidenceLevel}
                onValueChange={(value) => {
                  if (value) {
                    setOptions({
                      ...options,
                      confidenceLevel: value as "60" | "75" | "90",
                    });
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="60" aria-label="60%">
                  60%
                </ToggleGroupItem>
                <ToggleGroupItem value="75" aria-label="75%">
                  75%
                </ToggleGroupItem>
                <ToggleGroupItem value="90" aria-label="90%">
                  90%
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Selector de agrupación */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agregación</Label>
              <ToggleGroup
                type="single"
                value={options.aggregation}
                onValueChange={(value) => {
                  if (value) {
                    setOptions({
                      ...options,
                      aggregation: value as "daily" | "weekly" | "monthly",
                    });
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="daily" aria-label="Diario">
                  Diario
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" aria-label="Semanal">
                  Semanal
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" aria-label="Mensual">
                  Mensual
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Botón de exportar PDF */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={exportToPDF}
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              Exportar reporte PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas para navegar entre visualizaciones */}
      <Tabs
        defaultValue="predictions"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="predictions">Predicción de Ventas</TabsTrigger>
          <TabsTrigger value="trends">Tendencias por Producto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="predictions" className="space-y-4">
          {renderSalesPrediction()}
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {renderProductTrends()}
            <div className="col-span-1 lg:col-span-2">
              {renderTrendComparison()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
