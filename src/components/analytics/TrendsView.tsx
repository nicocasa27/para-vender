import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getTopSellingProducts } from "@/lib/api/inventory.api";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { TrendBarChart } from "./TrendComponents";

interface TopProduct {
  name: string;
  totalSales: number;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

export const TrendsView = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()),
    to: new Date(),
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["topProducts", date?.from, date?.to],
    queryFn: () => getTopSellingProducts(date?.from, date?.to),
    enabled: !!date?.from && !!date?.to,
  });

  useEffect(() => {
    if (data) {
      // Transformar los datos para que coincidan con la estructura esperada por TrendBarChart
      const transformedData = data.map((product) => ({
        name: product.name,
        trendPercentage: product.totalSales,
        trending: "up", // Como es el top de ventas, asumimos que la tendencia es positiva
      }));
      setTopProducts(transformedData);
    }
  }, [data]);

  const handleDateChange = useCallback(
    (newDate: DateRange | undefined) => {
      setDate(newDate);
      if (newDate?.from && newDate?.to) {
        refetch(); // Recargar los datos al cambiar las fechas
      }
    },
    [refetch]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Ventas</CardTitle>
          <CardDescription>
            Análisis de las tendencias de ventas de tus productos.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Top Productos</h3>
            <DateSelector date={date} onDateChange={handleDateChange} />
          </div>
          <Separator className="my-2" />
          {isLoading ? (
            <LoadingState />
          ) : (
            <TrendBarChart data={topProducts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function LoadingState() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-64" />
    </div>
  );
}

interface DateSelectorProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

function DateSelector({ date, onDateChange }: DateSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              `${format(date.from, "dd MMMM yyyy", { locale: es })} - ${format(date.to, "dd MMMM yyyy", { locale: es })}`
            ) : (
              format(date.from, "dd MMMM yyyy", { locale: es })
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onDateChange}
          numberOfMonths={2}
          locale={es}
          from={new Date('2024-01-01')}
          to={new Date()}
          className="border-0 rounded-md"
          styles={{
            head_cell: {
              color: 'red'
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
