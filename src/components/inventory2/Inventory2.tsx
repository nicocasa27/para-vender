
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsView } from "./ProductsView";
import { CategoriesView } from "./CategoriesView";
import { StoresView } from "./StoresView";
import { TransfersView } from "./TransfersView";

export function Inventory2() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventario 2.0</h2>
        <p className="text-muted-foreground mt-2">
          Visualización y gestión alternativa del inventario, categorías, sucursales y transferencias.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="stores">Sucursales</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="flex-1 mt-4">
          <ProductsView key={`products-${refreshTrigger}`} onRefresh={handleRefresh} />
        </TabsContent>
        
        <TabsContent value="categories" className="flex-1 mt-4">
          <CategoriesView key={`categories-${refreshTrigger}`} onRefresh={handleRefresh} />
        </TabsContent>
        
        <TabsContent value="stores" className="flex-1 mt-4">
          <StoresView key={`stores-${refreshTrigger}`} onRefresh={handleRefresh} />
        </TabsContent>
        
        <TabsContent value="transfers" className="flex-1 mt-4">
          <TransfersView key={`transfers-${refreshTrigger}`} onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
