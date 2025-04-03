
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Store, RefreshCw, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type InventorySummaryItem = {
  store: string;
  storeId: string;
  capacity: number;
  lowStock: Array<{
    name: string;
    stock: number;
    min: number;
  }>;
};

interface InventorySummaryProps {
  showLowStock?: boolean;
  storeIds?: string[];
}

export const InventorySummary = ({ showLowStock = true, storeIds = [] }: InventorySummaryProps) => {
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<{
    storeCount: number;
    passedStoreIds: string[];
    foundStores: {id: string, name: string}[];
    lastFetchTime: string;
  }>({
    storeCount: 0,
    passedStoreIds: [],
    foundStores: [],
    lastFetchTime: ""
  });

  const fetchInventoryData = async () => {
    if (hasError && retryCount > 0) {
      // Si ya ha fallado y estamos reintentando, esperamos un poco
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log("InventorySummary: Iniciando fetchInventoryData, storeIds:", storeIds);
      
      // Actualizar información de depuración
      setDebugInfo(prev => ({
        ...prev,
        passedStoreIds: [...storeIds],
        lastFetchTime: new Date().toISOString()
      }));
      
      // Fetch stores
      let storeQuery = supabase.from('almacenes').select('id, nombre');
      
      // Filter stores if storeIds are provided and not empty
      const { data: almacenes, error: almacenesError } = storeIds.length > 0 
        ? await storeQuery.in('id', storeIds)
        : await storeQuery;

      if (almacenesError) {
        console.error("InventorySummary: Error fetching almacenes:", almacenesError);
        toast.error("Error al cargar almacenes", { 
          description: almacenesError.message 
        });
        throw new Error(`Error fetching almacenes: ${almacenesError.message}`);
      }

      // Actualizar información de depuración
      setDebugInfo(prev => ({
        ...prev,
        storeCount: almacenes?.length || 0,
        foundStores: almacenes || []
      }));

      console.log("InventorySummary: Almacenes encontrados:", almacenes);
      
      if (!almacenes || almacenes.length === 0) {
        console.log("InventorySummary: No se encontraron almacenes");
        setInventorySummary([]);
        setIsLoading(false);
        return;
      }

      // Prepare promises for each store to fetch inventory data in parallel
      const storePromises = almacenes.map(async (almacen) => {
        try {
          console.log(`InventorySummary: Consultando inventario para almacén ${almacen.nombre} (${almacen.id})`);
          
          // Fetch inventory for this store
          const { data: inventario, error: inventarioError } = await supabase
            .from('inventario')
            .select(`
              cantidad, 
              producto_id, 
              productos(nombre, stock_minimo, stock_maximo)
            `)
            .eq('almacen_id', almacen.id);

          if (inventarioError) {
            console.error(`InventorySummary: Error fetching inventory for store ${almacen.nombre}:`, inventarioError);
            return null;
          }

          console.log(`InventorySummary: Encontrados ${inventario?.length || 0} productos en inventario para ${almacen.nombre}`);

          // Calculate capacity as a percentage of total max stock
          let totalQuantity = 0;
          let totalMaxStock = 0;
          const lowStockItems = [];

          for (const item of inventario || []) {
            if (item.productos) {
              const producto = item.productos as any;
              
              // Verificar que los campos numéricos sean válidos
              const cantidad = Number(item.cantidad) || 0;
              const stockMaximo = Number(producto.stock_maximo) || 100;
              const stockMinimo = Number(producto.stock_minimo) || 0;
              
              totalQuantity += cantidad;
              totalMaxStock += stockMaximo;

              // Check if this item is low on stock
              if (cantidad < stockMinimo) {
                lowStockItems.push({
                  name: producto.nombre,
                  stock: Math.round(cantidad),
                  min: Math.round(stockMinimo)
                });
              }
            }
          }

          // Calculate capacity as a percentage
          const capacity = totalMaxStock > 0 
            ? Math.round((totalQuantity / totalMaxStock) * 100) 
            : 0;

          return {
            store: almacen.nombre,
            storeId: almacen.id,
            capacity: Math.min(capacity, 100), // Cap at 100%
            lowStock: lowStockItems
          };
        } catch (error) {
          console.error(`InventorySummary: Error processing store ${almacen.nombre}:`, error);
          return null;
        }
      });

      // Wait for all store data to be processed in parallel
      const results = await Promise.all(storePromises);
      
      // Filter out any null results from failed store queries
      const validResults = results.filter(Boolean) as InventorySummaryItem[];
      
      console.log("InventorySummary: Resultados procesados:", validResults);
      setInventorySummary(validResults);
    } catch (error) {
      console.error('InventorySummary: Error fetching inventory summary:', error);
      setHasError(true);
      setRetryCount(prev => prev + 1);
      toast.error("No se pudo cargar el resumen de inventario");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("InventorySummary: useEffect ejecutado, storeIds:", storeIds);
    
    // Evitar bucles infinitos de intentos fallidos
    if (retryCount > 3) {
      console.log("InventorySummary: Máximo número de reintentos alcanzado, deteniendo intentos");
      return;
    }
    
    fetchInventoryData();
  }, [storeIds, retryCount, hasError]);

  const handleRefresh = () => {
    setRetryCount(0);
    fetchInventoryData();
  };

  // Mostrar un mensaje de carga durante el primer intento
  if (isLoading && retryCount === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-elevation h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            {showLowStock ? "Alertas de Stock Bajo" : "Capacidad de Inventario"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Después de los reintentos, mostrar un mensaje de error más amigable
  if (hasError && retryCount > 2) {
    return (
      <Card className="transition-all duration-300 hover:shadow-elevation h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            {showLowStock ? "Alertas de Stock Bajo" : "Capacidad de Inventario"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Reintentar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
            <p className="text-center mb-4">
              No se pudo cargar el resumen de inventario. Por favor intente más tarde.
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">
          {showLowStock ? "Alertas de Stock Bajo" : "Capacidad de Inventario"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={handleRefresh} title="Actualizar datos">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {inventorySummary.length === 0 ? (
          <div className="space-y-6">
            {/* Mensaje cuando no hay almacenes o inventario */}
            <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                {storeIds && storeIds.length > 0 ? (
                  <>No hay datos de inventario disponibles para las sucursales seleccionadas.</>
                ) : (
                  <>No hay datos de inventario disponibles. Por favor verifique que existan sucursales y productos en el sistema.</>
                )}
              </AlertDescription>
            </Alert>
            
            {/* Información de depuración para administradores */}
            <div className="text-xs text-muted-foreground border rounded-md p-3 mt-4">
              <details>
                <summary className="cursor-pointer font-medium mb-2">Información de diagnóstico</summary>
                <div className="space-y-1">
                  <p>Última consulta: {debugInfo.lastFetchTime}</p>
                  <p>IDs de sucursales proporcionados: {debugInfo.passedStoreIds.length ? debugInfo.passedStoreIds.join(', ') : 'ninguno'}</p>
                  <p>Sucursales encontradas: {debugInfo.storeCount}</p>
                  {debugInfo.foundStores.length > 0 && (
                    <ul className="list-disc pl-4">
                      {debugInfo.foundStores.map(store => (
                        <li key={store.id}>{store.nombre} ({store.id})</li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {inventorySummary.map((store) => (
              <div key={store.storeId} className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Store className="h-4 w-4 text-muted-foreground mr-1" />
                    <h4 className="font-medium">{store.store}</h4>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {store.capacity}% capacidad
                  </span>
                </div>
                <Progress value={store.capacity} className="h-2" />
                
                {showLowStock && store.lowStock.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h5 className="text-sm font-medium flex items-center text-amber-500">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Alertas de Stock Bajo
                    </h5>
                    <div className="space-y-1">
                      {store.lowStock.map((item) => (
                        <div
                          key={item.name}
                          className="text-sm flex justify-between items-center py-1 px-2 bg-amber-50 dark:bg-amber-950/20 rounded-md"
                        >
                          <span>{item.name}</span>
                          <span className="font-medium">
                            {item.stock}/{item.min} unidades
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
