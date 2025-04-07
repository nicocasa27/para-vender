
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, Plus, Filter, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductsTable } from "@/components/inventory/ProductsTable";
import { ProductForm } from "@/components/inventory/ProductForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";
import { Product } from "@/types/inventory";
import { ProductsView } from "./ProductsView";
import { CategoriesView } from "./CategoriesView";
import { StoresView } from "./StoresView";
import { TransfersView } from "./TransfersView";

export const Inventory = () => {
  const [activeTab, setActiveTab] = useState("products");
  const { hasMetadata } = useProductMetadata();
  const { stores } = useStores();

  const handleRefresh = () => {
    // Este método se pasa a los componentes hijos para refrescar los datos
    // cuando sea necesario (por ejemplo, después de editar/añadir/eliminar)
    // Cada componente tiene su propia lógica de refresco
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
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
