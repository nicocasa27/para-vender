import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

export const InventorySummary = ({ showLowStock = true }: InventorySummaryProps) => {
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInventoryData = async () => {
      setIsLoading(true);
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
          return;
        }

        // Prepare promises for each store to fetch inventory data in parallel
        const storePromises = almacenes.map(async (almacen) => {
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
        toast({
          title: "Error",
          description: "No se pudo cargar el resumen de inventario",
          variant: "destructive",
        });
        setInventorySummary([]);
      } finally {
        // Always set loading to false, even if there's an error
        setIsLoading(false);
      }
    };

    fetchInventoryData();
    
    // Return a cleanup function
    return () => {
      // Cleanup is important to prevent state updates after unmounting
      setIsLoading(false);
    };
  }, [toast]);

  if (isLoading) {
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
