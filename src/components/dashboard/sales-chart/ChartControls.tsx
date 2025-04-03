
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartControlsProps } from "./types";

export const ChartControls: React.FC<ChartControlsProps> = ({
  timeRange,
  selectedStore,
  chartType,
  stores,
  onTimeRangeChange,
  onStoreChange,
  onChartTypeChange
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={chartType}
        onValueChange={onChartTypeChange}
      >
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue placeholder="Tipo de gráfica" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bar">Barras</SelectItem>
          <SelectItem value="pie">Pastel</SelectItem>
          <SelectItem value="line">Línea</SelectItem>
          <SelectItem value="area">Área</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={selectedStore || "all"}
        onValueChange={onStoreChange}
      >
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue placeholder="Tienda" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las Tiendas</SelectItem>
          {stores.map(store => (
            <SelectItem key={store.id} value={store.id || "no-id"}>
              {store.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tabs
        defaultValue="monthly"
        value={timeRange}
        onValueChange={onTimeRangeChange}
      >
        <TabsList className="grid grid-cols-3 h-8">
          <TabsTrigger value="daily" className="text-xs">Diario</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs">Semanal</TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs">Mensual</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
