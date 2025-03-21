import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronDown, 
  MoreHorizontal, 
  Search,
  Package,
  Filter,
  Plus,
  Edit,
  Trash,
  FileText,
  Check,
  X,
  Loader
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProductWithStock {
  id: string;
  nombre: string;
  categoria: string;
  categoria_id: string;
  unidad: string;
  unidad_id: string;
  precio_compra: number;
  precio_venta: number;
  stock: {
    [key: string]: number;
  };
  stock_minimo: number;
  stock_maximo: number;
}

export const ProductTable = () => {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [newStockQuantity, setNewStockQuantity] = useState(0);
  const [selectedStockWarehouse, setSelectedStockWarehouse] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categorias")
          .select("id, nombre");
        
        if (categoriesError) throw categoriesError;
        
        const formattedCategories = [
          { id: "all", name: "Todas las Categorías" },
          ...categoriesData.map(cat => ({ id: cat.id, name: cat.nombre }))
        ];
        setCategories(formattedCategories);
        
        const { data: storesData, error: storesError } = await supabase
          .from("almacenes")
          .select("id, nombre");
        
        if (storesError) throw storesError;
        
        const formattedStores = [
          { id: "all", name: "Todos los Almacenes" },
          ...storesData.map(store => ({ id: store.id, name: store.nombre }))
        ];
        setStores(formattedStores);
        
        const { data: productsData, error: productsError } = await supabase
          .from("productos")
          .select(`
            id, nombre, precio_compra, precio_venta, stock_minimo, stock_maximo,
            categoria_id, categorias(nombre),
            unidad_id, unidades(nombre)
          `);
        
        if (productsError) throw productsError;
        
        const productsWithStock = await Promise.all(
          productsData.map(async (product) => {
            const { data: inventoryData, error: inventoryError } = await supabase
              .from("inventario")
              .select(`
                cantidad,
                almacen_id,
                almacenes(id, nombre)
              `)
              .eq("producto_id", product.id);
            
            if (inventoryError) throw inventoryError;
            
            const stockByStore: {[key: string]: number} = {};
            inventoryData.forEach(item => {
              if (item.almacenes) {
                stockByStore[item.almacenes.nombre] = item.cantidad;
              }
            });
            
            return {
              id: product.id,
              nombre: product.nombre,
              categoria: product.categorias ? product.categorias.nombre : "Sin categoría",
              categoria_id: product.categoria_id,
              unidad: product.unidades ? product.unidades.nombre : "Unidad",
              unidad_id: product.unidad_id,
              precio_compra: product.precio_compra,
              precio_venta: product.precio_venta,
              stock: stockByStore,
              stock_minimo: product.stock_minimo,
              stock_maximo: product.stock_maximo,
            };
          })
        );
        
        setProducts(productsWithStock);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error: inventoryError } = await supabase
        .from("inventario")
        .delete()
        .eq("producto_id", id);
      
      if (inventoryError) throw inventoryError;
      
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setProducts(prev => prev.filter(product => product.id !== id));
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleStockUpdate = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setNewStockQuantity(0);
    setSelectedStockWarehouse("");
    setIsStockDialogOpen(true);
  };

  const saveStockUpdate = async () => {
    if (!selectedProduct || !selectedStockWarehouse || newStockQuantity <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese una cantidad válida y seleccione un almacén.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: existingInventory, error: checkError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", selectedProduct.id)
        .eq("almacen_id", selectedStockWarehouse)
        .maybeSingle();

      if (checkError) throw checkError;

      const updateResult = existingInventory
        ? await supabase
            .from("inventario")
            .update({
              cantidad: existingInventory.cantidad + newStockQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingInventory.id)
        : await supabase
            .from("inventario")
            .insert({
              producto_id: selectedProduct.id,
              almacen_id: selectedStockWarehouse,
              cantidad: newStockQuantity,
            });

      if (updateResult.error) throw updateResult.error;

      const { error: movementError } = await supabase
        .from("movimientos")
        .insert({
          producto_id: selectedProduct.id,
          tipo: "entrada",
          cantidad: newStockQuantity,
          almacen_destino_id: selectedStockWarehouse,
          notas: "Actualización manual de inventario",
        });

      if (movementError) throw movementError;

      setProducts((prevProducts) => {
        return prevProducts.map((product) => {
          if (product.id === selectedProduct.id) {
            const updatedStock = { ...product.stock };
            const storeName = stores.find((store) => store.id === selectedStockWarehouse)?.name || "";
            
            if (storeName) {
              updatedStock[storeName] = (updatedStock[storeName] || 0) + newStockQuantity;
            }
            
            return {
              ...product,
              stock: updatedStock,
            };
          }
          return product;
        });
      });

      setIsStockDialogOpen(false);
      
      toast({
        title: "Stock actualizado",
        description: "El inventario ha sido actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoria_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const currentStoreName = stores.find(store => store.id === selectedStore)?.name || "";

  const handleAddProductSubmit = async (data: any) => {
    try {
      const { data: newProduct, error: productError } = await supabase
        .from("productos")
        .insert({
          nombre: data.name,
          categoria_id: data.category,
          unidad_id: data.unit,
          precio_compra: data.purchasePrice,
          precio_venta: data.salePrice,
          stock_minimo: data.minStock,
          stock_maximo: data.maxStock,
        })
        .select()
        .single();

      if (productError) throw productError;

      if (data.initialStock > 0 && data.warehouse) {
        const { error: inventoryError } = await supabase
          .from("inventario")
          .insert({
            producto_id: newProduct.id,
            almacen_id: data.warehouse,
            cantidad: data.initialStock,
          });

        if (inventoryError) throw inventoryError;

        const { error: movementError } = await supabase
          .from("movimientos")
          .insert({
            producto_id: newProduct.id,
            tipo: "entrada",
            cantidad: data.initialStock,
            almacen_destino_id: data.warehouse,
            notas: "Stock inicial",
          });

        if (movementError) throw movementError;
      }

      const warehouseName = stores.find(store => store.id === data.warehouse)?.name || "";
      
      const newProductWithStock: ProductWithStock = {
        id: newProduct.id,
        nombre: data.name,
        categoria: categories.find(cat => cat.id === data.category)?.name || "Sin categoría",
        categoria_id: data.category,
        unidad: units.find(unit => unit.id === data.unit)?.name || "Unidad",
        unidad_id: data.unit,
        precio_compra: data.purchasePrice,
        precio_venta: data.salePrice,
        stock: warehouseName ? { [warehouseName]: data.initialStock } : {},
        stock_minimo: data.minStock,
        stock_maximo: data.maxStock,
      };

      setProducts(prev => [...prev, newProductWithStock]);
      setIsAddDialogOpen(false);

      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado correctamente.",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditProductSubmit = async (data: any) => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("productos")
        .update({
          nombre: data.name,
          categoria_id: data.category,
          unidad_id: data.unit,
          precio_compra: data.purchasePrice,
          precio_venta: data.salePrice,
          stock_minimo: data.minStock,
          stock_maximo: data.maxStock,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      setProducts(prevProducts => {
        return prevProducts.map(product => {
          if (product.id === selectedProduct.id) {
            return {
              ...product,
              nombre: data.name,
              categoria: categories.find(cat => cat.id === data.category)?.name || "Sin categoría",
              categoria_id: data.category,
              unidad: units.find(unit => unit.id === data.unit)?.name || "Unidad",
              unidad_id: data.unit,
              precio_compra: data.purchasePrice,
              precio_venta: data.salePrice,
              stock_minimo: data.minStock,
              stock_maximo: data.maxStock,
            };
          }
          return product;
        });
      });

      setIsEditDialogOpen(false);
      
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    async function fetchUnits() {
      try {
        const { data: unitsData, error: unitsError } = await supabase
          .from("unidades")
          .select("id, nombre");
        
        if (unitsError) throw unitsError;
        
        setUnits(unitsData.map(unit => ({ id: unit.id, name: unit.nombre })));
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    }
    
    fetchUnits();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Complete los detalles del producto y presione guardar cuando termine.
                </DialogDescription>
              </DialogHeader>
              <ProductForm 
                onSubmit={handleAddProductSubmit} 
                isSubmitting={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No se encontraron productos</h3>
            <p className="text-muted-foreground max-w-xs mt-2">
              No hay productos que coincidan con su búsqueda. Intenta con otros filtros o añade un
              nuevo producto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio Compra</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Stock</TableHead>
                  {selectedStore !== "all" && (
                    <TableHead>Disponibilidad</TableHead>
                  )}
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => {
                  const stockInSelectedStore = selectedStore !== "all" 
                    ? (product.stock[currentStoreName] || 0)
                    : Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
                  
                  const isLowStock = stockInSelectedStore < product.stock_minimo;
                  const isAvailableInStore = selectedStore !== "all" && stockInSelectedStore > 0;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.nombre}</TableCell>
                      <TableCell>{product.categoria}</TableCell>
                      <TableCell>{product.unidad}</TableCell>
                      <TableCell>${product.precio_compra.toFixed(2)}</TableCell>
                      <TableCell>${product.precio_venta.toFixed(2)}</TableCell>
                      <TableCell>
                        {stockInSelectedStore} {product.unidad}
                      </TableCell>
                      {selectedStore !== "all" && (
                        <TableCell>
                          {isAvailableInStore ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={isLowStock ? "destructive" : "outline"}>
                          {isLowStock ? "Stock Bajo" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStockUpdate(product)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Actualizar Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 px-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Mostrando <strong>{paginatedProducts.length}</strong> de{" "}
              <strong>{filteredProducts.length}</strong> productos
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => setPage(index + 1)}
                      isActive={page === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    className={
                      page >= totalPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Actualice los detalles del producto y presione guardar cuando termine.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm 
              initialData={{
                name: selectedProduct.nombre,
                category: selectedProduct.categoria_id,
                unit: selectedProduct.unidad_id,
                purchasePrice: selectedProduct.precio_compra,
                salePrice: selectedProduct.precio_venta,
                minStock: selectedProduct.stock_minimo,
                maxStock: selectedProduct.stock_maximo,
                initialStock: 0,
                warehouse: "",
              }}
              onSubmit={handleEditProductSubmit}
              isSubmitting={isLoading}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Actualizar Stock</DialogTitle>
            <DialogDescription>
              Introduzca la cantidad a añadir y seleccione el almacén.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{selectedProduct?.nombre} 
                {selectedProduct && <span className="text-sm text-muted-foreground ml-2">({selectedProduct.unidad})</span>}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none">Almacén</label>
                  <Select
                    value={selectedStockWarehouse}
                    onValueChange={setSelectedStockWarehouse}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione Almacén" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores
                        .filter(store => store.id !== "all")
                        .map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none">Cantidad a añadir ({selectedProduct?.unidad})</label>
                  <Input
                    type="number"
                    min="1"
                    value={newStockQuantity}
                    onChange={(e) => setNewStockQuantity(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsStockDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={saveStockUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

