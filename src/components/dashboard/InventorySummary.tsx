
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type InventorySummaryItem = {
  store: string;
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

  useEffect(() => {
    // Evitar bucles infinitos de intentos fallidos
    if (retryCount > 3) {
      console.log("Máximo número de reintentos alcanzado, deteniendo intentos");
      return;
    }
    
    const fetchInventoryData = async () => {
      if (hasError && retryCount > 0) {
        // Si ya ha fallado y estamos reintentando, esperamos un poco
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setIsLoading(true);
      setHasError(false);
      
      try {
        // Fetch stores
        const { data: almacenes, error: almacenesError } = await supabase
          .from('almacenes')
          .select('id, nombre');

        if (almacenesError) {
          throw new Error(`Error fetching almacenes: ${almacenesError.message}`);
        }

        if (!almacenes || almacenes.length === 0) {
          setInventorySummary([]);
          setIsLoading(false);
          return;
        }

        // Filter stores if storeIds are provided
        const filteredStores = storeIds.length > 0 
          ? almacenes.filter(store => storeIds.includes(store.id))
          : almacenes;

        // Prepare promises for each store to fetch inventory data in parallel
        const storePromises = filteredStores.map(async (almacen) => {
          try {
            // Fetch inventory for this store
            const { data: inventario, error: inventarioError } = await supabase
              .from('inventario')
              .select('cantidad, producto_id, productos(nombre, stock_minimo, stock_maximo)')
              .eq('almacen_id', almacen.id);

            if (inventarioError) {
              console.error(`Error fetching inventory for store ${almacen.nombre}:`, inventarioError);
              return null;
            }

            // Calculate capacity as a percentage of total max stock
            let totalQuantity = 0;
            let totalMaxStock = 0;
            const lowStockItems = [];

            for (const item of inventario || []) {
              if (item.productos) {
                const producto = item.productos as any;
                totalQuantity += Number(item.cantidad) || 0;
                totalMaxStock += Number(producto.stock_maximo) || 100;

                // Check if this item is low on stock
                if (Number(item.cantidad) < Number(producto.stock_minimo)) {
                  lowStockItems.push({
                    name: producto.nombre,
                    stock: Math.round(Number(item.cantidad) || 0),
                    min: Number(producto.stock_minimo) || 0
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
              capacity: Math.min(capacity, 100), // Cap at 100%
              lowStock: lowStockItems
            };
          } catch (error) {
            console.error(`Error processing store ${almacen.nombre}:`, error);
            return null;
          }
        });

        // Wait for all store data to be processed in parallel
        const results = await Promise.all(storePromises);
        
        // Filter out any null results from failed store queries
        const validResults = results.filter(Boolean) as InventorySummaryItem[];
        
        setInventorySummary(validResults);
      } catch (error) {
        console.error('Error fetching inventory summary:', error);
        setHasError(true);
        setRetryCount(prev => prev + 1);
        toast.error("No se pudo cargar el resumen de inventario");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, [storeIds, retryCount, hasError]);

  // Mostrar un mensaje de carga durante el primer intento
  if (isLoading && retryCount === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-elevation">
        <CardHeader>
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
      <Card className="transition-all duration-300 hover:shadow-elevation">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {showLowStock ? "Alertas de Stock Bajo" : "Capacidad de Inventario"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
            <p className="text-center">
              No se pudo cargar el resumen de inventario. Por favor intente más tarde.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          {showLowStock ? "Alertas de Stock Bajo" : "Capacidad de Inventario"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inventorySummary.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            No hay datos de inventario disponibles
          </div>
        ) : (
          <div className="space-y-6">
            {inventorySummary.map((store) => (
              <div key={store.store} className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{store.store}</h4>
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
