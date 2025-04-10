
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductTable from "./ProductTable";
import { CategoriesView } from "./CategoriesView";
import { StoresView } from "./StoresView";
import { TransfersView } from "./TransfersView";
import { ProductsView } from "@/components/inventory/ProductsView";
import { StoreSelector } from "./StoreSelector";
import { useProducts } from "@/hooks/useProducts";

export function Inventory() {
  const { storeFilter, setStoreFilter } = useProducts();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
        <StoreSelector 
          selectedStore={storeFilter} 
          onStoreChange={setStoreFilter}
          className="w-full md:w-64" 
        />
      </div>
      
      <Tabs defaultValue="products">
        <TabsList className="w-full bg-white border">
          <TabsTrigger value="products" className="flex-1">Productos</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1">Categorías</TabsTrigger>
          <TabsTrigger value="stores" className="flex-1">Sucursales</TabsTrigger>
          <TabsTrigger value="transfers" className="flex-1">Transferencias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <ProductsView />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <CategoriesView />
        </TabsContent>
        
        <TabsContent value="stores" className="mt-6">
          <StoresView />
        </TabsContent>
        
        <TabsContent value="transfers" className="mt-6">
          <TransfersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
