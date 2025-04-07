import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, Plus, Filter, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductsTable } from "@/components/inventory2/ProductsTable";
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

  const fetchProducts = useCallback(async () => {
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
        // Buscar inventario para este producto: any) => {
        const inventory = inventoryData.filter((i: any) => i.producto_id === product.id);
        const totalStock = inventory.reduce((sum: number, item: any) => sum + item.cantidad, 0);
        
        return {
          id: product.id,
          name: product.nombre,
          category: product.categorias?.id || "",e,
          categoryName: product.categorias?.nombre || "Sin categoría", "",
          unit: product.unidades?.id || "",
          unitName: product.unidades?.nombre || "Sin unidad",| "",
          unitAbbr: product.unidades?.abreviatura || "",
          purchasePrice: product.precio_compra,
          salePrice: product.precio_venta,
          minStock: product.stock_minimo,mo,
          maxStock: product.stock_maximo,imo,
          currentStock: totalStock,
          inventory: inventory,
          status: totalStock <= product.stock_minimo ? "low" : totalStock >= product.stock_maximo ? "high" : "normal"
        };
      });inventory: inventory,
 status: totalStock <= product.stock_minimo ? "low" : totalStock >= product.stock_maximo ? "high" : "normal"
      setProducts(formattedProducts);        };
    } catch (error: any) {
      toast.error("Error al cargar productos", {
        description: error.message,
      });
    } finally {st.error("Error al cargar productos", {
      setIsLoading(false);tion: error.message,
    }
  }, []); finally {
IsLoading(false);
  useEffect(() => {    }
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (formData: any) => {    fetchProducts();
    setIsSubmitting(true);
    try {
      // 1. Insertar el productoandleCreateProduct = async (formData: any) => {
      const { data: productData, error: productError } = await supabase
        .from("productos")
        .insert([{oducto
          nombre: formData.name,: productData, error: productError } = await supabase
          categoria_id: formData.category,
          unidad_id: formData.unit,
          precio_compra: formData.purchasePrice,
          precio_venta: formData.salePrice,
          stock_minimo: formData.minStock,
          stock_maximo: formData.maxStock,Price,
        }]),
        .select("id")tock_minimo: formData.minStock,
        .single();o: formData.maxStock,

      if (productError) throw productError;        .select("id")

      // 2. Si hay stock inicial, crear registro de inventario
      if (formData.initialStock > 0 && formData.warehouse) {
        const { error: inventoryError } = await supabase
          .from("inventario")ntario
          .insert([{ck > 0 && formData.warehouse) {
            producto_id: productData.id,r: inventoryError } = await supabase
            sucursal_id: formData.warehouse,
            cantidad: formData.initialStock
          }]);
cursal_id: formData.warehouse,
        if (inventoryError) throw inventoryError;            cantidad: formData.initialStock
      }

      toast.success("Producto creado correctamente");        if (inventoryError) throw inventoryError;
      setIsFormOpen(false);
      fetchProducts();
    } catch (error: any) {roducto creado correctamente");
      toast.error("Error al crear el producto", {;
        description: error.message,
      });
    } finally {st.error("Error al crear el producto", {
      setIsSubmitting(false);tion: error.message,
    }
  }; finally {
  setIsSubmitting(false);
  const handleEditProduct = async (formData: any) => {    }
    if (!currentProduct) return;
    
    setIsSubmitting(true);nst handleEditProduct = async (formData: any) => {
    try {eturn;
      const { error } = await supabase
        .from("productos")
        .update({
          nombre: formData.name,or } = await supabase
          categoria_id: formData.category,
          unidad_id: formData.unit,
          precio_compra: formData.purchasePrice,
          precio_venta: formData.salePrice,
          stock_minimo: formData.minStock,
          stock_maximo: formData.maxStock,Price,
        }),
        .eq("id", currentProduct.id);stock_minimo: formData.minStock,
tock,
      if (error) throw error;        })
uct.id);
      toast.success("Producto actualizado correctamente");
      setIsFormOpen(false);
      fetchProducts();
    } catch (error: any) {roducto actualizado correctamente");
      toast.error("Error al actualizar el producto", {;
        description: error.message,
      });
    } finally {st.error("Error al actualizar el producto", {
      setIsSubmitting(false);tion: error.message,
    }
  }; finally {
  setIsSubmitting(false);
  const handleDeleteProduct = async (productId: string) => {    }
    if (!window.confirm("¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }eDeleteProduct = async (productId: string) => {
f (!window.confirm("¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
    try {      return;
      // Primero eliminar registros de inventario
      const { error: inventoryError } = await supabase
        .from("inventario")
        .delete()egistros de inventario
        .eq("producto_id", productId);or: inventoryError } = await supabase

      if (inventoryError) throw inventoryError;        .delete()

      // Luego eliminar el producto
      const { error } = await supabaseentoryError;
        .from("productos")
        .delete() producto
        .eq("id", productId);or } = await supabase

      if (error) throw error;        .delete()

      toast.success("Producto eliminado correctamente");
      fetchProducts();
    } catch (error: any) {
      toast.error("Error al eliminar el producto", {cto eliminado correctamente");
        description: error.message,
      });
    }st.error("Error al eliminar el producto", {
  };   description: error.message,
  });
  const openEditForm = (product: Product) => {    }
    setCurrentProduct(product);
    setIsEditing(true);
    setIsFormOpen(true);(product: Product) => {
  };oduct);
setIsEditing(true);
  const openCreateForm = () => {    setIsFormOpen(true);
    setCurrentProduct(null);
    setIsEditing(false);
    setIsFormOpen(true); () => {
  };ll);
setIsEditing(false);
  const closeForm = () => {    setIsFormOpen(true);
    setIsFormOpen(false);
    setCurrentProduct(null);
    setIsEditing(false);
  };;
setCurrentProduct(null);
  const handleRefresh = () => {    setIsEditing(false);
    fetchProducts();
  };
nst handleRefresh = () => {
  return (    fetchProducts();
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario 2.0</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={isLoading} onClick={handleRefresh}>etween items-center">
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refrescar
          </Button>e="sm" variant="outline" disabled={isLoading} onClick={handleRefresh}>
          <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>ing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            <SheetTrigger asChild>
              <Button onClick={openCreateForm} disabled={!hasMetadata || stores.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>{openCreateForm} disabled={!hasMetadata || stores.length === 0}>
            </SheetTrigger>lassName="h-4 w-4 mr-2" />
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">cto
              <SheetHeader>
                <SheetTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</SheetTitle>
                <SheetDescription>
                  {isEditing 
                    ? "Actualice los detalles del producto existente."isEditing ? "Editar Producto" : "Nuevo Producto"}</SheetTitle>
                    : "Complete el formulario para agregar un nuevo producto al inventario."}
                </SheetDescription>
              </SheetHeader>s detalles del producto existente."
              <div className="mt-6">ete el formulario para agregar un nuevo producto al inventario."}
                <ProductForm
                  initialData={currentProduct || undefined}
                  onSubmit={isEditing ? handleEditProduct : handleCreateProduct}
                  isSubmitting={isSubmitting}
                  isEditing={isEditing} || undefined}
                /> handleEditProduct : handleCreateProduct}
              </div>isSubmitting={isSubmitting}
            </SheetContent>Editing={isEditing}
          </Sheet>
        </div>v>
      </div>SheetContent>
Sheet>
      <Tabs value={activeTab} onValueChange={setActiveTab}>        </div>
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>
        ger value="products">Productos</TabsTrigger>
        <TabsContent value="products" className="pt-4">  <TabsTrigger value="analysis">Análisis</TabsTrigger>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (lassName="flex justify-center items-center h-64">
            <Card>Loader className="h-8 w-8 animate-spin text-primary" />
              <CardHeader>
                <CardTitle>Lista de Productos</CardTitle>
                <CardDescription>
                  Gestione todos sus productos desde este panel
                </CardDescription>
              </CardHeader>
              <CardContent>todos sus productos desde este panel
                <ProductsTableiption>
                  products={products}
                  onEdit={openEditForm}
                  onDelete={handleDeleteProduct}
                />
              </CardContent>onEdit={openEditForm}
            </Card>handleDeleteProduct}
          )}
        </TabsContent>  </CardContent>
        
        <TabsContent value="analysis" className="pt-4">  )}
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Inventario</CardTitle>ue="analysis" className="pt-4">
              <CardDescription>
                Visualice métricas y análisis de su inventario
              </CardDescription>
            </CardHeader>
            <CardContent> métricas y análisis de su inventario
              <div className="text-center p-12 text-muted-foreground">iption>
                Próximamente: Métricas y análisis de inventario
              </div>
            </CardContent>lassName="text-center p-12 text-muted-foreground">
          </Card>te: Métricas y análisis de inventario
        </TabsContent>iv>
      </Tabs>ent>
    </div>ard>
  );TabsContent>
};  </Tabs>
};
