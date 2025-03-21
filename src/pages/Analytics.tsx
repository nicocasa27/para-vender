import { useState } from "react";
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
} from "recharts";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { 
  fetchSalesByCategory, 
  fetchStorePerformance, 
  fetchSalesTrend, 
  fetchInventoryLevels,
  SalesByCategory,
  SalesByStore,
  SalesData,
  InventoryData
} from "@/services/analytics";

// Colores para gráficas
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF5733', '#C70039', '#900C3F'];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("yearly");
  const [storeFilter, setStoreFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("sales");
  
  // Estado para almacenar datos reales
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [storePerformance, setStorePerformance] = useState<SalesByStore[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesData[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<InventoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formatear valores monetarios
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Análisis y Reportes</h2>
        <p className="text-muted-foreground mt-2">
          Analiza tendencias de ventas, desempeño de productos y niveles de inventario con visualizaciones detalladas.
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
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="stores">Tiendas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
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

      {/* Add the SalesChart at the top of the analytics page */}
      <div className="mb-6">
        <SalesChart />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div>
          {activeTab === "sales" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Ingresos y Ganancias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesTrend}>
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
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--primary))" />
                        <Bar dataKey="profit" name="Ganancias" fill="hsl(var(--accent-foreground))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Tendencia de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrend}>
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
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Ingresos"
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "products" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Distribución por Categoría</CardTitle>
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
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Ventas por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                        />
                        <Bar dataKey="value" name="Ventas" fill="hsl(var(--primary))">
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "stores" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Comparativa de Tiendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={storePerformance}>
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
                        <Legend />
                        <Bar dataKey="sales" name="Ventas" fill="hsl(var(--primary))" />
                        <Bar dataKey="profit" name="Ganancias" fill="hsl(var(--accent-foreground))" />
                      </BarChart>
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
                      <PieChart>
                        <Pie
                          data={storePerformance}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="sales"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {storePerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                        />
                      </PieChart>
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
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Tendencia de Inventario</CardTitle>
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
                          formatter={(value: number) => [`${value} unidades`, 'Nivel']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="level" 
                          name="Nivel de Inventario"
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
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
