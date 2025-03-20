
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
  { date: "Jan", revenue: 4000, profit: 2400 },
  { date: "Feb", revenue: 3000, profit: 1398 },
  { date: "Mar", revenue: 9800, profit: 2000 },
  { date: "Apr", revenue: 3908, profit: 2780 },
  { date: "May", revenue: 4800, profit: 1890 },
  { date: "Jun", revenue: 3800, profit: 2390 },
  { date: "Jul", revenue: 4300, profit: 3490 },
  { date: "Aug", revenue: 5300, profit: 3190 },
  { date: "Sep", revenue: 6200, profit: 3290 },
  { date: "Oct", revenue: 5100, profit: 2990 },
  { date: "Nov", revenue: 4100, profit: 2190 },
  { date: "Dec", revenue: 8200, profit: 4190 },
];

const categoryData = [
  { name: "Electronics", value: 45 },
  { name: "Clothing", value: 25 },
  { name: "Food & Beverages", value: 20 },
  { name: "Furniture", value: 10 },
];

const storeData = [
  { name: "Downtown Store", sales: 4000, profit: 2400 },
  { name: "Mall Store", sales: 3000, profit: 1398 },
  { name: "Online Warehouse", sales: 2000, profit: 980 },
];

const inventoryData = [
  { date: "Week 1", level: 80 },
  { date: "Week 2", level: 72 },
  { date: "Week 3", level: 65 },
  { date: "Week 4", level: 58 },
  { date: "Week 5", level: 50 },
  { date: "Week 6", level: 42 },
  { date: "Week 7", level: 85 },
  { date: "Week 8", level: 77 },
  { date: "Week 9", level: 70 },
  { date: "Week 10", level: 63 },
  { date: "Week 11", level: 55 },
  { date: "Week 12", level: 48 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("yearly");
  const [storeFilter, setStoreFilter] = useState("all");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h2>
        <p className="text-muted-foreground mt-2">
          Analyze sales trends, product performance, and inventory levels with detailed visualizations.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs 
          defaultValue="sales" 
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={storeFilter} 
            onValueChange={setStoreFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="downtown">Downtown Store</SelectItem>
              <SelectItem value="mall">Mall Store</SelectItem>
              <SelectItem value="online">Online Warehouse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-elevation">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue & Profit</CardTitle>
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
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" />
                  <Bar dataKey="profit" name="Profit" fill="hsl(var(--accent-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-elevation">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Sales Trend Over Time</CardTitle>
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
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
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

        <Card className="transition-all duration-300 hover:shadow-elevation">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Product Category Distribution</CardTitle>
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
                    formatter={(value) => [`${value}%`, 'Percentage']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-elevation">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Inventory Level Trends</CardTitle>
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
                  />
                  <Area 
                    type="monotone" 
                    dataKey="level" 
                    name="Inventory Level"
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorLevel)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
