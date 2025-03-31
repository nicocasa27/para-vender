
import { TopSellingProduct } from "@/services/analytics";

export type TimeRange = "daily" | "weekly" | "monthly";
export type ChartType = "bar" | "pie" | "line" | "area";

export interface SalesChartProps {
  storeIds?: string[];
}

export interface ChartControlsProps {
  timeRange: TimeRange;
  selectedStore: string | null;
  chartType: ChartType;
  stores: {id: string, nombre: string}[];
  onTimeRangeChange: (value: string) => void;
  onStoreChange: (value: string) => void;
  onChartTypeChange: (value: string) => void;
}

export interface ChartRendererProps {
  chartType: ChartType;
  chartData: TopSellingProduct[];
  isLoading: boolean;
  hasError: boolean;
}
