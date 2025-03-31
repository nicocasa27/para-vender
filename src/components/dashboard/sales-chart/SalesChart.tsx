
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartControls } from "./ChartControls";
import { ChartRenderer } from "./ChartRenderer";
import { useSalesChart } from "./useSalesChart";
import { SalesChartProps } from "./types";

export const SalesChart = ({ storeIds = [] }: SalesChartProps) => {
  const {
    timeRange,
    selectedStore,
    chartType,
    chartData,
    isLoading,
    stores,
    hasError,
    handleTimeRangeChange,
    handleStoreChange,
    handleChartTypeChange
  } = useSalesChart(storeIds);

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Productos Más Vendidos</CardTitle>
        <ChartControls
          timeRange={timeRange}
          selectedStore={selectedStore}
          chartType={chartType}
          stores={stores}
          onTimeRangeChange={handleTimeRangeChange}
          onStoreChange={handleStoreChange}
          onChartTypeChange={handleChartTypeChange}
        />
      </CardHeader>
      <CardContent>
        <ChartRenderer
          chartType={chartType}
          chartData={chartData}
          isLoading={isLoading}
          hasError={hasError}
        />
      </CardContent>
    </Card>
  );
};
