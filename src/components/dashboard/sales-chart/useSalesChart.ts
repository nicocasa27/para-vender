
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { fetchTopSellingProducts, TopSellingProduct } from "@/services/analytics";
import { toast } from "sonner";
import { TimeRange, ChartType } from "./types";

export const useSalesChart = (storeIds: string[] = []) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [chartData, setChartData] = useState<TopSellingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<{id: string, nombre: string}[]>([]);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch stores con manejo de errores mejorado
  useEffect(() => {
    const fetchStores = async () => {
      try {
        let query = supabase.from('almacenes').select('id, nombre');
        
        // If storeIds are provided, filter by them
        if (storeIds.length > 0) {
          query = query.in('id', storeIds);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching stores:', error);
          return;
        }
        
        if (data) {
          setStores(data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };
    
    // Solo intentar cargar tiendas si no tenemos datos aún o si cambian los storeIds
    if (stores.length === 0 || storeIds.length > 0) {
      fetchStores();
    }
  }, [storeIds, stores.length]);

  // Fetch top selling products based on timeRange and selectedStore
  // Con manejo de errores mejorado y prevención de bucles infinitos
  const fetchProductSalesData = useCallback(async () => {
    if (retryCount > 3) {
      console.log("Máximo número de reintentos alcanzado, deteniendo intentos");
      return;
    }
    
    if (hasError && retryCount > 0) {
      // Si ya ha fallado y estamos reintentando, esperamos un poco
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Si no hay tiendas seleccionadas, mostrar datos de muestra
      if (stores.length === 0 && storeIds.length === 0) {
        const sampleData: TopSellingProduct[] = [
          { name: "Producto 1", value: 120 },
          { name: "Producto 2", value: 85 },
          { name: "Producto 3", value: 70 },
          { name: "Producto 4", value: 55 },
          { name: "Producto 5", value: 40 }
        ];
        setChartData(sampleData);
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching data with timeRange: ${timeRange}, store: ${selectedStore || 'all'}`);
      // If user has selected a specific store, use that, otherwise use the props storeIds if provided
      const storeIdsToUse = selectedStore ? [selectedStore] : storeIds;
      
      try {
        const data = await fetchTopSellingProducts(timeRange, selectedStore || (storeIdsToUse.length > 0 ? storeIdsToUse : null));
        console.log('Fetched data:', data);
        setChartData(data);
      } catch (error) {
        console.error('Error fetching top selling products:', error);
        // Si hay un error, usar datos de muestra
        const sampleData: TopSellingProduct[] = [
          { name: "Producto A", value: 100 },
          { name: "Producto B", value: 75 },
          { name: "Producto C", value: 50 },
          { name: "Producto D", value: 25 },
          { name: "Producto E", value: 10 }
        ];
        setChartData(sampleData);
        
        setHasError(true);
        setRetryCount(prev => prev + 1);
        
        // Solo mostrar toast en el primer error
        if (retryCount === 0) {
          toast.error("No se pudieron cargar los productos más vendidos");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedStore, storeIds, stores.length, hasError, retryCount]);

  // Refetch data when timeRange or selectedStore changes
  useEffect(() => {
    fetchProductSalesData();
  }, [timeRange, selectedStore, fetchProductSalesData]);

  // Handlers for control changes
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
  };

  const handleStoreChange = (value: string) => {
    setSelectedStore(value === "all" ? null : value);
  };

  const handleChartTypeChange = (value: string) => {
    setChartType(value as ChartType);
  };

  return {
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
  };
};
