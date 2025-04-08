
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, RefreshCcw } from "lucide-react";
import { ProductsView } from "@/components/ProductsView";
import { CategoriesView } from "@/components/inventory/CategoriesView";
import { StoresView } from "@/components/inventory/StoresView";
import { TransfersView } from "@/components/inventory/TransfersView";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState("products");
  const { hasMetadata, refetch: refetchMetadata } = useProductMetadata();
  const { stores, refetch: refetchStores } = useStores();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    
    // Refrescar datos de todas las fuentes
    Promise.all([
      refetchStores(),
      refetchMetadata()
    ]).catch(error => {
      console.error("Error al refrescar datos:", error);
      toast.error("Error al refrescar datos");
    }).finally(() => {
      setLoading(false);
      toast.success("Datos actualizados correctamente");
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <Button size="sm" variant="outline" disabled={loading} onClick={handleRefresh}>
          {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          Refrescar
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
