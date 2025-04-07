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

export const Inventory2 = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const { hasMetadata } = useProductMetadata();
  const { stores } = useStores();
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("productos")
        .select(`
          id, 
          nombre, 
          precio_compra, 
          precio_venta, 
          stock_minimo, 
          stock_maximo,
          categorias(id, nombre),
          unidades(id, nombre, abreviatura)
        `)
        .order('nombre');

      if (error) throw error;

      // También obtener inventario actual de cada producto
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventario")
        .select(`
          producto_id,
          sucursal_id,
          cantidad
        `);

      if (inventoryError) throw inventoryError;

      // Mapear los datos a un formato más fácil de usar
      const formattedProducts = data.map((product: any) => {
        // Buscar inventario para este producto
        const inventory = inventoryData.filter((i: any) => i.producto_id === product.id);
        const totalStock = inventory.reduce((sum: number, item: any) => sum + item.cantidad, 0);
        
        return {
          id: product.id,
          name: product.nombre,
          category: product.categorias?.id || "",
          categoryName: product.categorias?.nombre || "Sin categoría",
          unit: product.unidades?.id || "",
          unitName: product.unidades?.nombre || "Sin unidad",
          unitAbbr: product.unidades?.abreviatura || "",
          purchasePrice: product.precio_compra,
          salePrice: product.precio_venta,
          minStock: product.stock_minimo,
          maxStock: product.stock_maximo,
          currentStock: totalStock,
          inventory: inventory,
          status: totalStock <= product.stock_minimo ? "low" : totalStock >= product.stock_maximo ? "high" : "normal"
        };
      });

      setProducts(formattedProducts);
    } catch (error: any) {
      toast.error("Error al cargar productos", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // 1. Insertar el producto
      const { data: productData, error: productError } = await supabase
        .from("productos")
        .insert([{
          nombre: formData.name,
          categoria_id: formData.category,
          unidad_id: formData.unit,
          precio_compra: formData.purchasePrice,
          precio_venta: formData.salePrice,
          stock_minimo: formData.minStock,
          stock_maximo: formData.maxStock,
        }])
        .select("id")
        .single();

      if (productError) throw productError;

      // 2. Si hay stock inicial, crear registro de inventario
      if (formData.initialStock > 0 && formData.warehouse) {
        const { error: inventoryError } = await supabase
          .from("inventario")
          .insert([{
            producto_id: productData.id,
            sucursal_id: formData.warehouse,
            cantidad: formData.initialStock
          }]);

        if (inventoryError) throw inventoryError;
      }

      toast.success("Producto creado correctamente");
      setIsFormOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error("Error al crear el producto", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (formData: any) => {
    if (!currentProduct) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("productos")
        .update({
          nombre: formData.name,
          categoria_id: formData.category,
          unidad_id: formData.unit,
          precio_compra: formData.purchasePrice,
          precio_venta: formData.salePrice,
          stock_minimo: formData.minStock,
          stock_maximo: formData.maxStock,
        })
        .eq("id", currentProduct.id);

      if (error) throw error;

      toast.success("Producto actualizado correctamente");
      setIsFormOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error("Error al actualizar el producto", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      // Primero eliminar registros de inventario
      const { error: inventoryError } = await supabase
        .from("inventario")
        .delete()
        .eq("producto_id", productId);

      if (inventoryError) throw inventoryError;

      // Luego eliminar el producto
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast.success("Producto eliminado correctamente");
      fetchProducts();
    } catch (error: any) {
      toast.error("Error al eliminar el producto", {
        description: error.message,
      });
    }
  };

  const openEditForm = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setCurrentProduct(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setCurrentProduct(null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario 2.0</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
            <SheetTrigger asChild>
              <Button onClick={openCreateForm} disabled={!hasMetadata || stores.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</SheetTitle>
                <SheetDescription>
                  {isEditing 
                    ? "Actualice los detalles del producto existente."
                    : "Complete el formulario para agregar un nuevo producto al inventario."}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ProductForm
                  initialData={currentProduct || undefined}
                  onSubmit={isEditing ? handleEditProduct : handleCreateProduct}
                  isSubmitting={isSubmitting}
                  isEditing={isEditing}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Productos</CardTitle>
                <CardDescription>
                  Gestione todos sus productos desde este panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductsTable
                  products={products}
                  onEdit={openEditForm}
                  onDelete={handleDeleteProduct}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="analysis" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Inventario</CardTitle>
              <CardDescription>
                Visualice métricas y análisis de su inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 text-muted-foreground">
                Próximamente: Métricas y análisis de inventario
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
