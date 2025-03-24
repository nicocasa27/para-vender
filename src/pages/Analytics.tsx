
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Treemap,
} from "recharts";
import { 
  fetchSalesByCategory, 
  fetchStorePerformance, 
  fetchSalesTrend, 
  fetchInventoryLevels,
  fetchCustomerSegmentation,
  fetchSalesHourlyDistribution,
  fetchProductProfitability,
  fetchProductsByPopularity,
  SalesByCategory,
  SalesByStore,
  SalesData,
  InventoryData,
  CustomerSegment,
  HourlyDistribution,
  ProductProfitability,
  ProductPopularity
} from "@/services/analytics";
import { useToast } from "@/hooks/use-toast";

// Color schemes for charts
const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--secondary))', 
  '#00C49F', 
  '#FFBB28', 
  '#FF8042', 
  '#8884d8', 
  '#FF5733', 
  '#C70039', 
  '#900C3F',
  '#581845'
];

const COLOR_GRADIENT = [
  'hsla(var(--primary)/0.3)',
  'hsla(var(--primary)/0.4)',
  'hsla(var(--primary)/0.5)',
  'hsla(var(--primary)/0.6)',
  'hsla(var(--primary)/0.7)',
  'hsla(var(--primary)/0.8)',
  'hsla(var(--primary)/0.9)',
  'hsl(var(--primary))',
];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("yearly");
  const [storeFilter, setStoreFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("sales");
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const { toast } = useToast();
  
  // Estado para almacenar datos
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [storePerformance, setStorePerformance] = useState<SalesByStore[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesData[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<InventoryData[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDistribution[]>([]);
  const [productProfitability, setProductProfitability] = useState<ProductProfitability[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductPopularity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos reales al montar el componente o cuando cambian los filtros
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, storesData, salesData, inventoryData, customerData, hourlyData, profitabilityData, popularityData] = await Promise.all([
          fetchSalesByCategory(timeRange, storeFilter),
          fetchStorePerformance(timeRange),
          fetchSalesTrend(timeRange),
          fetchInventoryLevels(),
          fetchCustomerSegmentation(),
          fetchSalesHourlyDistribution(),
          fetchProductProfitability(),
          fetchProductsByPopularity()
        ]);

        setSalesByCategory(categoriesData);
        setStorePerformance(storesData);
        setSalesTrend(salesData);
        setInventoryLevels(inventoryData);
        setCustomerSegments(customerData);
        setHourlyDistribution(hourlyData);
        setProductProfitability(profitabilityData);
        setPopularProducts(popularityData);
      } catch (error) {
        console.error("Error cargando datos de análisis:", error);
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar todos los datos de análisis",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [timeRange, storeFilter, toast]);

  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Análisis y Reportes</h2>
        <p className="text-muted-foreground mt-2">
          Visualización detallada de tendencias de ventas, desempeño de productos, inventario y más.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs 
          defaultValue="sales" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales" className="text-xs md:text-sm">Ventas</TabsTrigger>
            <TabsTrigger value="products" className="text-xs md:text-sm">Productos</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs md:text-sm">Clientes</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs md:text-sm">Inventario</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={storeFilter} 
            onValueChange={setStoreFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tienda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Tiendas</SelectItem>
              {storePerformance.map(store => (
                <SelectItem key={store.name} value={store.name}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div>
          {activeTab === "sales" && (
            <>
              <Tabs 
                defaultValue="overview" 
                value={activeSubTab}
                onValueChange={setActiveSubTab}
                className="w-full mb-4"
              >
                <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-4">
                  <TabsTrigger value="overview" className="text-xs">General</TabsTrigger>
                  <TabsTrigger value="trends" className="text-xs">Tendencias</TabsTrigger>
                  <TabsTrigger value="distribution" className="text-xs">Distribución</TabsTrigger>
                  <TabsTrigger value="hourly" className="text-xs">Por Hora</TabsTrigger>
                </TabsList>
              </Tabs>

              {activeSubTab === "overview" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Ingresos y Ganancias</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={salesTrend}
                            barGap={0}
                            barCategoryGap="10%"
                            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs"
                              angle={-45}
                              textAnchor="end" 
                              height={50}
                            />
                            <YAxis className="text-xs" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: number) => [formatCurrency(value), '']}
                              labelFormatter={(label) => `Período: ${label}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="revenue" 
                              name="Ingresos" 
                              fill="hsl(var(--primary))"
                              animationDuration={1500}
                              animationBegin={0}
                              animationEasing="ease-out"
                            />
                            <Bar 
                              dataKey="profit" 
                              name="Ganancias" 
                              fill="hsl(var(--accent-foreground))"
                              animationDuration={1500}
                              animationBegin={300}
                              animationEasing="ease-out"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Ventas por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={salesByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              animationDuration={1800}
                              animationBegin={0}
                              animationEasing="ease-out"
                            >
                              {salesByCategory.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                              labelFormatter={(label) => `Categoría: ${label}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSubTab === "trends" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Tendencia de Ventas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={salesTrend}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: number) => [formatCurrency(value), '']}
                              labelFormatter={(label) => `Período: ${label}`}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              name="Ingresos"
                              fill="hsla(var(--primary)/0.2)" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              animationDuration={1800}
                              animationBegin={0}
                              animationEasing="ease-out"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="profit" 
                              name="Ganancias"
                              stroke="hsl(var(--accent-foreground))" 
                              strokeWidth={2}
                              activeDot={{ r: 6 }}
                              animationDuration={1800}
                              animationBegin={300}
                              animationEasing="ease-out"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Comparativa de Tiendas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={storePerformance} 
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                            <XAxis type="number" className="text-xs" />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              className="text-xs" 
                              width={100}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: number) => [formatCurrency(value), '']}
                            />
                            <Legend />
                            <Bar 
                              dataKey="sales" 
                              name="Ventas" 
                              fill="hsl(var(--primary))"
                              animationDuration={1500}
                              animationBegin={0}
                              animationEasing="ease-out"
                            />
                            <Bar 
                              dataKey="profit" 
                              name="Ganancias" 
                              fill="hsl(var(--accent-foreground))"
                              animationDuration={1500}
                              animationBegin={300}
                              animationEasing="ease-out"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSubTab === "distribution" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Distribución por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <Treemap
                            data={salesByCategory}
                            dataKey="value"
                            nameKey="name"
                            aspectRatio={4/3}
                            stroke="hsl(var(--background))"
                            animationDuration={1800}
                            animationBegin={0}
                            animationEasing="ease-out"
                          >
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: number, name: string) => [`${value}%`, name]}
                            />
                            {salesByCategory.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Treemap>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Rendimiento por Tienda</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart 
                            outerRadius={80} 
                            width={500} 
                            height={300} 
                            data={storePerformance.slice(0, 6)}
                          >
                            <PolarGrid className="stroke-muted" />
                            <PolarAngleAxis dataKey="name" className="text-xs" />
                            <PolarRadiusAxis className="text-xs" />
                            <Radar 
                              name="Ventas" 
                              dataKey="sales" 
                              stroke="hsl(var(--primary))" 
                              fill="hsla(var(--primary)/0.5)"
                              animationDuration={1800}
                              animationBegin={0}
                              animationEasing="ease-out" 
                            />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSubTab === "hourly" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="md:col-span-2 transition-all duration-300 hover:shadow-elevation">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Distribución de Ventas por Hora</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={hourlyDistribution}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="hour" 
                              className="text-xs"
                              tickFormatter={(hour) => `${hour}:00`}
                            />
                            <YAxis className="text-xs" yAxisId="left" />
                            <YAxis className="text-xs" yAxisId="right" orientation="right" />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                              formatter={(value: any, name: string) => {
                                if (name === "transactions") return [`${value} ventas`, "Transacciones"];
                                return [formatCurrency(value), "Monto"];
                              }}
                              labelFormatter={(hour) => `Hora: ${hour}:00`}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="transactions" 
                              name="Transacciones" 
                              stroke="hsl(var(--primary))" 
                              fillOpacity={1} 
                              fill="url(#colorTransactions)"
                              yAxisId="left"
                              animationDuration={1800}
                              animationBegin={0}
                              animationEasing="ease-out"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="amount" 
                              name="Monto" 
                              stroke="hsl(var(--secondary))" 
                              fillOpacity={1} 
                              fill="url(#colorAmount)"
                              yAxisId="right"
                              animationDuration={1800}
                              animationBegin={300}
                              animationEasing="ease-out"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {activeTab === "products" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Rentabilidad de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          dataKey="sales" 
                          name="Ventas" 
                          className="text-xs"
                          domain={[0, 'dataMax + 20']}
                          label={{ value: 'Ventas (unidades)', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="margin" 
                          name="Margen" 
                          className="text-xs"
                          domain={[0, 'dataMax + 10']}
                          label={{ value: 'Margen (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <ZAxis 
                          type="number" 
                          dataKey="revenue" 
                          range={[60, 400]} 
                          name="Ingresos" 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === "Ventas") return [`${value} unidades`, name];
                            if (name === "Margen") return [`${value}%`, name];
                            return [formatCurrency(value), name];
                          }}
                          cursor={{ strokeDasharray: '3 3' }}
                          labelFormatter={(index) => productProfitability[index]?.name || ''}
                        />
                        <Legend />
                        <Scatter 
                          name="Productos" 
                          data={productProfitability}
                          fill="hsl(var(--primary))"
                          animationDuration={1800}
                          animationBegin={0}
                          animationEasing="ease-out"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Popularidad de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={popularProducts}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" className="text-xs" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          className="text-xs"
                          width={70}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value} ventas`, 'Popularidad']}
                        />
                        <Bar 
                          dataKey="sales" 
                          name="Ventas"
                          animationDuration={1500}
                          animationBegin={0}
                          animationEasing="ease-out"
                        >
                          {popularProducts.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLOR_GRADIENT[Math.min(index, COLOR_GRADIENT.length - 1)]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Segmentación de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerSegments}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          animationDuration={1800}
                          animationBegin={0}
                          animationEasing="ease-out"
                        >
                          {customerSegments.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Valor de Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={customerSegments}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                        />
                        <Bar 
                          dataKey="spending" 
                          name="Gasto Promedio"
                          animationDuration={1500}
                          animationBegin={0}
                          animationEasing="ease-out"
                        >
                          {customerSegments.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Niveles de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={inventoryLevels}>
                        <defs>
                          <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value} unidades`, 'Nivel']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="level" 
                          name="Nivel de Inventario"
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorLevel)"
                          animationDuration={1800}
                          animationBegin={0}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Rotación de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={inventoryLevels}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value}`, 'Índice de Rotación']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="turnover" 
                          name="Rotación"
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          animationDuration={1800}
                          animationBegin={0}
                          animationEasing="ease-out"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
