import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("nombre");

      if (error) {
        throw error;
      }
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = () => {
    fetchProducts();
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
