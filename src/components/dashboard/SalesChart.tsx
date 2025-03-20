
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// This is dummy data for the chart
const dailyData = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 500 },
  { name: "Thu", value: 450 },
  { name: "Fri", value: 650 },
  { name: "Sat", value: 700 },
  { name: "Sun", value: 550 },
];

const weeklyData = [
  { name: "Week 1", value: 2400 },
  { name: "Week 2", value: 1800 },
  { name: "Week 3", value: 3000 },
  { name: "Week 4", value: 2700 },
];

const monthlyData = [
  { name: "Jan", value: 9500 },
  { name: "Feb", value: 8200 },
  { name: "Mar", value: 12000 },
  { name: "Apr", value: 10800 },
  { name: "May", value: 14000 },
  { name: "Jun", value: 12500 },
];

type TimeRange = "daily" | "weekly" | "monthly";

export const SalesChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  const data = {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
  }[timeRange];

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Sales Trends</CardTitle>
        <Tabs
          defaultValue="daily"
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
        >
          <TabsList className="grid grid-cols-3 h-8">
            <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
