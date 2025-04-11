
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { SalesChart } from "@/components/dashboard";

export default function Analytics() {
  const { stores, isLoading: loadingStores } = useCurrentStores();
  const [dateRange, setDateRange] = useState("week");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  useEffect(() => {
    if (stores && stores.length > 0) {
      setSelectedStoreIds(stores.map(store => store.id));
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
    </div>
  );
}
