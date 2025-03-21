
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type InventorySummaryItem = {
  store: string;
  capacity: number;
  lowStock: Array<{
    name: string;
    stock: number;
    min: number;
  }>;
};

export const InventorySummary = () => {
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryData = async () => {
      setIsLoading(true);
      try {
        // Fetch stores
        const { data: almacenes, error: almacenesError } = await supabase
          .from('almacenes')
          .select('id, nombre');

        if (almacenesError) {
          console.error('Error fetching almacenes:', almacenesError);
          return;
        }

        const summaryData: InventorySummaryItem[] = [];

        // For each store, calculate capacity and low stock products
        for (const almacen of almacenes) {
          // Fetch inventory for this store
          const { data: inventario, error: inventarioError } = await supabase
            .from('inventario')
            .select('cantidad, producto_id, productos(nombre, stock_minimo, stock_maximo)')
            .eq('almacen_id', almacen.id);

          if (inventarioError) {
            console.error(`Error fetching inventory for store ${almacen.nombre}:`, inventarioError);
            continue;
          }

          // Calculate capacity as a percentage of total max stock
          let totalQuantity = 0;
          let totalMaxStock = 0;
          const lowStockItems = [];

          for (const item of inventario) {
            if (item.productos) {
              const producto = item.productos as any;
              totalQuantity += item.cantidad;
              totalMaxStock += producto.stock_maximo || 100;

              // Check if this item is low on stock
              if (item.cantidad < producto.stock_minimo) {
                lowStockItems.push({
                  name: producto.nombre,
                  stock: Math.round(item.cantidad),
                  min: producto.stock_minimo
                });
              }
            }
          }

          // Calculate capacity as a percentage
          const capacity = totalMaxStock > 0 
            ? Math.round((totalQuantity / totalMaxStock) * 100) 
            : 0;

          summaryData.push({
            store: almacen.nombre,
            capacity: Math.min(capacity, 100), // Cap at 100%
            lowStock: lowStockItems
          });
        }

        setInventorySummary(summaryData);
      } catch (error) {
        console.error('Error fetching inventory summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  if (isLoading) {
    return (
      <Card className="transition-all duration-300 hover:shadow-elevation">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Resumen de Inventario
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
          Resumen de Inventario
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              
              {store.lowStock.length > 0 && (
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
      </CardContent>
    </Card>
  );
};
