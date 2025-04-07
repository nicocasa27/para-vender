import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";r } from "@/components/ui/tabs";
import { Loader, Plus, Filter, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";egrations/supabase/client";
import { ProductForm } from "@/components/inventory/ProductForm";uctsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";e } from "@/components/ui/card";
import { useProductMetadata } from "@/hooks/useProductMetadata";omponents/ui/sheet";
import { useStores } from "@/hooks/useStores";
import { useStores } from "@/hooks/useStores";
import { Product } from "@/types/inventory";
import { ProductsView } from "./ProductsView";View";
import { CategoriesView } from "./CategoriesView";
import { StoresView } from "./StoresView";
View";
export const Inventory = () => {
  const [activeTab, setActiveTab] = useState("products");export const Inventory = () => {
  const { hasMetadata } = useProductMetadata();] = useState("products");
  const { stores } = useStores();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);seState(false);
ct[]>([]);
  const fetchProducts = useCallback(async () => {
    setLoading(true);  const fetchProducts = useCallback(async () => {
    try {
    try {rror } = await supabase
        .from("productos")st { data, error } = await supabase
        .select("*")
        .select("*")
        .order("nombre");

        throw error;      if (error) {
      }r;
      setProducts(data || []);
    } catch (error: any) {etProducts(data || []);
    } catch (error: any) {
        title: "Error",
        description: error.message,: "Error",
        variant: "destructive",ror.message,
        variant: "destructive",
      });
    } finally {Loading(false);
      setLoading(false);
    }
  }, []);
ct(() => {
  useEffect(() => {    fetchProducts();
  }, [fetchProducts]);;
);
  const handleRefresh = () => {
    fetchProducts();  const handleRefresh = () => {
    fetchProducts();
  };
turn (
    <div className="container mx-auto p-4 space-y-6">  return (
      <div className="flex justify-between items-center">lassName="container mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Inventario</h1>er">
        <Button size="sm" variant="outline" disabled={loading} onClick={handleRefresh}>>
          {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}ing} onClick={handleRefresh}>
          RefrescarssName="mr-2 h-4 w-4" />}
        </Button>
        </Button>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>      <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>gger value="products">Productos</TabsTrigger>
          <TabsTrigger value="stores">Sucursales</TabsTrigger>er>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
        </TabsList>rigger>
        
        <TabsContent value="products" className="pt-4">
          <ProductsView onRefresh={handleRefresh} /><TabsContent value="products" className="pt-4">
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <CategoriesView onRefresh={handleRefresh} /><TabsContent value="categories" className="pt-4">
          <CategoriesView onRefresh={handleRefresh} />
        
        <TabsContent value="stores" className="pt-4">
          <StoresView onRefresh={handleRefresh} /><TabsContent value="stores" className="pt-4">
        </TabsContent>
        
        <TabsContent value="transfers" className="pt-4">
          <TransfersView onRefresh={handleRefresh} /><TabsContent value="transfers" className="pt-4">
        </TabsContent>
      </Tabs>
    </div>
  );
};
