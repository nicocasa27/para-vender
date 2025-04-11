
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesChart } from "@/components/dashboard";
import { StoreMonthlySalesChart } from "@/components/analytics/StoreMonthlySalesChart";
import { TotalSalesByStoreChart } from "@/components/analytics/TotalSalesByStoreChart";
import { NonSellingProductsChart } from "@/components/analytics/NonSellingProductsChart";

export default function Analytics() {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [dateRange, setDateRange] = useState("week");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelectedStoreIds(stores.map(store => store.id));
      console.log("Tiendas disponibles:", stores);
    }
  }, [stores]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Analíticas</h2>
        <p className="text-muted-foreground">
          Visualiza el rendimiento de ventas e inventario
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-medium">Resumen de Ventas</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            onClick={() => {
              setDateRange("week");
            }}
            size="sm"
          >
            Semana
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => {
              setDateRange("month");
            }}
            size="sm"
          >
            Mes
          </Button>
          <Button
            variant={dateRange === "year" ? "default" : "outline"}
            onClick={() => {
              setDateRange("year");
            }}
            size="sm"
          >
            Año
          </Button>
        </div>
      </div>
      
      {/* SalesChart */}
      <SalesChart storeIds={selectedStoreIds} />
      
      {/* Monthly Store Sales Comparison */}
      {selectedStoreIds.length > 0 && (
        <StoreMonthlySalesChart storeIds={selectedStoreIds} />
      )}
      
      {/* Total Sales by Store */}
      {selectedStoreIds.length > 0 && (
        <TotalSalesByStoreChart storeIds={selectedStoreIds} dateRange={dateRange} />
      )}
      
      {/* Non-Selling Products */}
      {selectedStoreIds.length > 0 && (
        <NonSellingProductsChart storeIds={selectedStoreIds} dateRange={dateRange} />
      )}
    </div>
  );
}
