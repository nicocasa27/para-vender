
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Loader } from "lucide-react";
import { ProductsView } from "./ProductsView";
import { CategoriesView } from "./CategoriesView";
import { StoresView } from "./StoresView";
import { TransfersView } from "./TransfersView";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";
import { ProductModal } from "./ProductModal";
import { Product } from "@/types/inventory";
import { useProducts } from "@/hooks/useProducts";

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { hasMetadata, isLoading: metadataLoading } = useProductMetadata();
  const { stores, isLoading: storesLoading } = useStores();
  const { addProduct, refreshProducts } = useProducts();

  const handleAddProduct = async (productData: any) => {
    await addProduct(productData);
    setIsAddModalOpen(false);
    refreshProducts();
  };

  const handleRefresh = () => {
    refreshProducts();
  };

  const isLoading = metadataLoading || storesLoading;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={!hasMetadata || stores.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
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

      {isAddModalOpen && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProduct}
        />
      )}
    </div>
  );
};
