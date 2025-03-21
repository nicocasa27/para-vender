
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Dummy data for charts
const salesData = [
  { date: "Ene", revenue: 4000, profit: 2400 },
  { date: "Feb", revenue: 3000, profit: 1398 },
  { date: "Mar", revenue: 9800, profit: 2000 },
  { date: "Abr", revenue: 3908, profit: 2780 },
  { date: "May", revenue: 4800, profit: 1890 },
  { date: "Jun", revenue: 3800, profit: 2390 },
  { date: "Jul", revenue: 4300, profit: 3490 },
  { date: "Ago", revenue: 5300, profit: 3190 },
  { date: "Sep", revenue: 6200, profit: 3290 },
  { date: "Oct", revenue: 5100, profit: 2990 },
  { date: "Nov", revenue: 4100, profit: 2190 },
  { date: "Dic", revenue: 8200, profit: 4190 },
];

const categoryData = [
  { name: "Electrónica", value: 45 },
  { name: "Ropa", value: 25 },
  { name: "Alimentos", value: 20 },
  { name: "Muebles", value: 10 },
];

const storeData = [
  { name: "Tienda Centro", sales: 4000, profit: 2400 },
  { name: "Tienda Mall", sales: 3000, profit: 1398 },
  { name: "Almacén Online", sales: 2000, profit: 980 },
];

const inventoryData = [
  { date: "Semana 1", level: 80 },
  { date: "Semana 2", level: 72 },
  { date: "Semana 3", level: 65 },
  { date: "Semana 4", level: 58 },
  { date: "Semana 5", level: 50 },
  { date: "Semana 6", level: 42 },
  { date: "Semana 7", level: 85 },
  { date: "Semana 8", level: 77 },
  { date: "Semana 9", level: 70 },
  { date: "Semana 10", level: 63 },
  { date: "Semana 11", level: 55 },
  { date: "Semana 12", level: 48 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("yearly");
  const [storeFilter, setStoreFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("sales");

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
              <SelectItem value="downtown">Tienda Centro</SelectItem>
              <SelectItem value="mall">Tienda Mall</SelectItem>
              <SelectItem value="online">Almacén Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="sales" className="m-0">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-300 hover:shadow-elevation">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Ingresos y Ganancias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
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
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
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
      </TabsContent>

      <TabsContent value="products" className="m-0">
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
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`${value}%`, 'Porcentaje']}
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
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`${value}%`, 'Porcentaje']}
                    />
                    <Bar dataKey="value" name="Ventas" fill="hsl(var(--primary))">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="stores" className="m-0">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-300 hover:shadow-elevation">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Comparativa de Tiendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
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
                      data={storeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="sales"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {storeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="inventory" className="m-0">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-300 hover:shadow-elevation">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Niveles de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={inventoryData}>
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
                      formatter={(value) => [`${value} unidades`, 'Nivel']}
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
                  <LineChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => [`${value} unidades`, 'Nivel']}
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
      </TabsContent>
    </div>
  );
};

export default Analytics;
