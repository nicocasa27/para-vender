
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

// Dummy data for inventory summary
const inventorySummary = [
  {
    store: "Downtown Store",
    capacity: 85,
    lowStock: [
      { name: "iPhone 13 Pro", stock: 2, min: 5 },
      { name: "AirPods Pro", stock: 3, min: 10 },
    ],
  },
  {
    store: "Mall Store",
    capacity: 62,
    lowStock: [
      { name: "MacBook Pro", stock: 1, min: 3 },
    ],
  },
  {
    store: "Online Warehouse",
    capacity: 45,
    lowStock: [],
  },
];

export const InventorySummary = () => {
  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Inventory Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {inventorySummary.map((store) => (
            <div key={store.store} className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{store.store}</h4>
                <span className="text-muted-foreground text-sm">
                  {store.capacity}% capacity
                </span>
              </div>
              <Progress value={store.capacity} className="h-2" />
              
              {store.lowStock.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h5 className="text-sm font-medium flex items-center text-amber-500">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Low Stock Alerts
                  </h5>
                  <div className="space-y-1">
                    {store.lowStock.map((item) => (
                      <div
                        key={item.name}
                        className="text-sm flex justify-between items-center py-1 px-2 bg-amber-50 dark:bg-amber-950/20 rounded-md"
                      >
                        <span>{item.name}</span>
                        <span className="font-medium">
                          {item.stock}/{item.min} units
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
