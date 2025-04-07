
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw } from "lucide-react";
import { ProductsView } from "./ProductsView";
import { CategoriesView } from "./CategoriesView";
import { StoresView } from "./StoresView";
import { TransfersView } from "./TransfersView";

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState("products");

  const handleRefresh = () => {
    // Este método se pasa a los componentes hijos para refrescar los datos
    // cuando sea necesario (por ejemplo, después de editar/añadir/eliminar)
    // Cada componente tiene su propia lógica de refresco
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="stores">Sucursales</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="pt-4">
          <ProductsView onRefresh={handleRefresh} />
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <CategoriesView onRefresh={handleRefresh} />
        </TabsContent>
        
        <TabsContent value="stores" className="pt-4">
          <StoresView onRefresh={handleRefresh} />
        </TabsContent>
        
        <TabsContent value="transfers" className="pt-4">
          <TransfersView onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
