
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsView } from "@/components/ProductsView";
import { CategoriesView } from "@/components/inventory/CategoriesView";
import { StoresView } from "@/components/inventory/StoresView";
import { StockTransfer } from "./StockTransfer";

export function Inventory() {
  const [activeView, setActiveView] = useState<
    "products" | "categories" | "stores" | "transfers"
  >("products");

  return (
    <div className="container py-6 max-w-7xl mx-auto space-y-6">
      <Tabs
        defaultValue="products"
        value={activeView}
        onValueChange={(value) => setActiveView(value as any)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="stores">Sucursales</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsView />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoriesView />
        </TabsContent>
        
        <TabsContent value="stores">
          <StoresView />
        </TabsContent>
        
        <TabsContent value="transfers">
          <StockTransfer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
