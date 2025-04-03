import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Product, Category, Store } from "@/types/inventory";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { ProductModal } from "./ProductModal";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductMovementHistory } from "./ProductMovementHistory";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

const ProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [storeFilter, setStoreFilter] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadStores();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select(`
          id, 
          nombre, 
          precio_venta,
          precio_compra,
          stock_minimo,
          stock_maximo,
          categoria_id,
          categorias(nombre),
          unidad_id,
          unidades(nombre)
        `);

      if (productsError) {
        throw productsError;
      }

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventario')
        .select(`
          producto_id, 
          cantidad, 
          almacen_id, 
          almacenes(nombre)
        `);
        
      if (inventoryError) {
        throw inventoryError;
      }
      
      const productsWithStock: Product[] = productsData.map(product => {
        const productInventory = inventoryData.filter(item => item.producto_id === product.id);
        
        const stockTotal = productInventory.reduce((sum, item) => sum + Number(item.cantidad), 0);
        
        const stockByStore: {[key: string]: number} = {};
        const storeNames: {[key: string]: string} = {};
        
        productInventory.forEach(item => {
          stockByStore[item.almacen_id] = Number(item.cantidad);
          if (item.almacenes) {
            storeNames[item.almacen_id] = item.almacenes.nombre;
          }
        });
          
        return {
          id: product.id,
          nombre: product.nombre,
          precio_venta: Number(product.precio_venta),
          precio_compra: Number(product.precio_compra),
          stock_total: stockTotal,
          stock_by_store: stockByStore,
          store_names: storeNames,
          categoria_id: product.categoria_id,
          categoria: product.categorias?.nombre || "Sin categoría",
          unidad_id: product.unidad_id,
          unidad: product.unidades?.nombre || "Unidad",
          stock_minimo: Number(product.stock_minimo),
          stock_maximo: Number(product.stock_maximo)
        };
      });

      setProducts(productsWithStock);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos", {
        description: "No se pudieron cargar los productos"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre');
      
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('almacenes')
        .select('id, nombre');
      
      if (error) throw error;
      setStores(data);
    } catch (error) {
      console.error("Error loading stores:", error);
    }
  };

  const handleAddProduct = async (productData: any) => {
    try {
      console.log("Adding product:", productData);
      
      if (!productData.name || !productData.category || !productData.unit) {
        toast.error("Datos incompletos", {
          description: "Por favor complete todos los campos obligatorios"
        });
        return;
      }
      
      const { data: newProduct, error: productError } = await supabase
        .from('productos')
        .insert([{
          nombre: productData.name,
          precio_compra: productData.purchasePrice || 0,
          precio_venta: productData.salePrice || 0,
          categoria_id: productData.category,
          unidad_id: productData.unit,
          stock_minimo: productData.minStock || 0,
          stock_maximo: productData.maxStock || 0
        }])
        .select('id')
        .single();

      if (productError) {
        console.error("Error inserting product:", productError);
        throw productError;
      }

      console.log("Product added successfully:", newProduct);

      if (productData.initialStock > 0 && productData.warehouse) {
        const { error: inventoryError } = await supabase
          .from('inventario')
          .insert([{
            producto_id: newProduct.id,
            almacen_id: productData.warehouse,
            cantidad: productData.initialStock
          }]);

        if (inventoryError) {
          console.error("Error inserting inventory:", inventoryError);
          throw inventoryError;
        }

        const { error: movementError } = await supabase
          .from('movimientos')
          .insert([{
            tipo: 'entrada',
            producto_id: newProduct.id,
            almacen_destino_id: productData.warehouse,
            cantidad: productData.initialStock,
            notas: 'Stock inicial'
          }]);
          
        if (movementError) {
          console.error("Error registering movement:", movementError);
        }
      }

      toast.success("Producto agregado", {
        description: `${productData.name} ha sido agregado correctamente`
      });
      
      loadProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error al agregar producto", {
        description: "No se pudo guardar el producto"
      });
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!currentProduct) return;
    
    try {
      console.log("Updating product:", productData);
      
      if (!productData.name || !productData.category || !productData.unit) {
        toast.error("Datos incompletos", {
          description: "Por favor complete todos los campos obligatorios"
        });
        return;
      }
      
      const { error: productError } = await supabase
        .from('productos')
        .update({
          nombre: productData.name,
          precio_compra: productData.purchasePrice || 0,
          precio_venta: productData.salePrice || 0,
          categoria_id: productData.category,
          unidad_id: productData.unit,
          stock_minimo: productData.minStock || 0,
          stock_maximo: productData.maxStock || 0
        })
        .eq('id', currentProduct.id);

      if (productError) {
        console.error("Error updating product:", productError);
        throw productError;
      }

      toast.success("Producto actualizado", {
        description: `${productData.name} ha sido actualizado correctamente`
      });
      
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error al actualizar producto", {
        description: "No se pudo actualizar el producto"
      });
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    
    try {
      const { error: inventoryError } = await supabase
        .from('inventario')
        .delete()
        .eq('producto_id', deleteProductId);

      if (inventoryError) throw inventoryError;

      const { error: productError } = await supabase
        .from('productos')
        .delete()
        .eq('id', deleteProductId);

      if (productError) throw productError;

      toast.success("Producto eliminado", {
        description: "El producto ha sido eliminado correctamente"
      });
      
      loadProducts();
      setDeleteProductId(null);
      
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto", {
        description: "No se pudo eliminar el producto"
      });
      setDeleteProductId(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === "all-categories" || product.categoria_id === categoryFilter;
    const matchesStore = !storeFilter || storeFilter === "all-stores" || product.stock_by_store?.[storeFilter] !== undefined;
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  const handleViewHistory = (productId: string) => {
    setSelectedProductId(productId);
    setIsHistoryOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Productos</h2>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
          <Button variant="outline" onClick={loadProducts}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">Todas las categorías</SelectItem>
            {categories
              .filter(category => !!category.id)
              .map((category) => (
                <SelectItem key={category.id} value={category.id || "cat-sin-id"}>
                  {category.nombre || "Categoría sin nombre"}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>

        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por sucursal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-stores">Todas las sucursales</SelectItem>
            {stores
              .filter(store => !!store.id)
              .map((store) => (
                <SelectItem key={store.id} value={store.id || "store-sin-id"}>
                  {store.nombre || "Sucursal sin nombre"}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No hay productos para mostrar</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock Total</TableHead>
                <TableHead>Stock Mínimo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.nombre}</TableCell>
                  <TableCell>{product.categoria}</TableCell>
                  <TableCell>${product.precio_venta.toFixed(2)}</TableCell>
                  <TableCell>{product.stock_total}</TableCell>
                  <TableCell>{product.stock_minimo}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewHistory(product.id)}
                    >
                      Ver
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setCurrentProduct(product);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDeleteProductId(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isAddModalOpen && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProduct}
        />
      )}

      {isEditModalOpen && currentProduct && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentProduct(null);
          }}
          onSubmit={handleEditProduct}
          initialData={{
            name: currentProduct.nombre,
            purchasePrice: currentProduct.precio_compra,
            salePrice: currentProduct.precio_venta,
            category: currentProduct.categoria_id,
            unit: currentProduct.unidad_id,
            minStock: currentProduct.stock_minimo,
            maxStock: currentProduct.stock_maximo
          }}
          isEditing
        />
      )}

      <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este producto y todo su inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteProduct}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Historial de Movimientos</SheetTitle>
            <SheetDescription>
              Registro de entradas, salidas y transferencias
            </SheetDescription>
          </SheetHeader>
          {selectedProductId && (
            <ProductMovementHistory productId={selectedProductId} />
          )}
          <div className="mt-4 flex justify-end">
            <SheetClose asChild>
              <Button variant="outline">Cerrar</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProductTable;
