
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
  X
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
        // Obtener categorías
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categorias")
          .select("id, nombre");
        
        if (categoriesError) throw categoriesError;
        
        const formattedCategories = [
          { id: "all", name: "Todas las Categorías" },
          ...categoriesData.map(cat => ({ id: cat.id, name: cat.nombre }))
        ];
        setCategories(formattedCategories);
        
        // Obtener almacenes
        const { data: storesData, error: storesError } = await supabase
          .from("almacenes")
          .select("id, nombre");
        
        if (storesError) throw storesError;
        
        const formattedStores = [
          { id: "all", name: "Todos los Almacenes" },
          ...storesData.map(store => ({ id: store.id, name: store.nombre }))
        ];
        setStores(formattedStores);
        
        // Obtener productos con sus detalles
        const { data: productsData, error: productsError } = await supabase
          .from("productos")
          .select(`
            id, nombre, precio_compra, precio_venta, stock_minimo, stock_maximo,
            categoria_id, categorias(nombre),
            unidad_id, unidades(nombre)
          `);
        
        if (productsError) throw productsError;
        
        // Obtener inventario para cada producto
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
            
            // Crear objeto de stock por almacén
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
      // Primero eliminar registros de inventario asociados
      const { error: inventoryError } = await supabase
        .from("inventario")
        .delete()
        .eq("producto_id", id);
      
      if (inventoryError) throw inventoryError;
      
      // Luego eliminar el producto
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      // Actualizar el estado
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
      // Verificar si ya existe un registro de inventario para este producto y almacén
      const { data: existingInventory, error: checkError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", selectedProduct.id)
        .eq("almacen_id", selectedStockWarehouse)
        .maybeSingle();

      if (checkError) throw checkError;

      // Crear registro de movimiento
      const { error: movementError } = await supabase
        .from("movimientos")
        .insert({
          producto_id: selectedProduct.id,
          tipo: "entrada",
          cantidad: newStockQuantity,
          almacen_destino_id: selectedStockWarehouse,
          notas: "Actualización manual de inventario"
        });

      if (movementError) throw movementError;

      if (existingInventory) {
        // Actualizar registro existente
        const newTotal = Number(existingInventory.cantidad) + Number(newStockQuantity);
        const { error: updateError } = await supabase
          .from("inventario")
          .update({ cantidad: newTotal, updated_at: new Date().toISOString() })
          .eq("id", existingInventory.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro de inventario
        const { error: insertError } = await supabase
          .from("inventario")
          .insert({
            producto_id: selectedProduct.id,
            almacen_id: selectedStockWarehouse,
            cantidad: newStockQuantity
          });

        if (insertError) throw insertError;
      }

      // Actualizar estado local
      setProducts(prevProducts => {
        return prevProducts.map(product => {
          if (product.id === selectedProduct.id) {
            const warehouseName = stores.find(store => store.id === selectedStockWarehouse)?.name || "";
            const updatedStock = { ...product.stock };
            
            if (warehouseName) {
              updatedStock[warehouseName] = (updatedStock[warehouseName] || 0) + newStockQuantity;
            }
            
            return { ...product, stock: updatedStock };
          }
          return product;
        });
      });

      toast({
        title: "Stock actualizado",
        description: "El inventario ha sido actualizado correctamente.",
      });

      setIsStockDialogOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const getTotalStock = (product: ProductWithStock) => {
    return Object.values(product.stock).reduce((acc, curr) => acc + Number(curr), 0);
  };

  const getStockStatus = (product: ProductWithStock) => {
    const totalStock = getTotalStock(product);
    if (totalStock <= product.stock_minimo) return "low";
    if (totalStock >= product.stock_maximo) return "high";
    return "normal";
  };
  
  const isProductAvailableInStore = (product: ProductWithStock, storeId: string) => {
    if (storeId === "all") return true;
    
    const storeName = stores.find(store => store.id === storeId)?.name;
    if (!storeName) return false;
    
    return (product.stock[storeName] || 0) > 0;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "all" ||
      product.categoria_id === selectedCategory;
    
    // Mostramos todos los productos independientemente de la disponibilidad en la tienda seleccionada
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);
      
      if (page <= 2) {
        endPage = 3;
      } else if (page >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      if (startPage > 2) {
        pageNumbers.push('ellipsis-start');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis-end');
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const getAvailabilityDisplay = (product: ProductWithStock) => {
    if (selectedStore === "all") {
      return (
        <div className="flex items-center">
          <Check className="h-4 w-4 text-green-500 mr-1" />
          <span>Disponible</span>
        </div>
      );
    }
    
    const storeName = stores.find(store => store.id === selectedStore)?.name;
    if (!storeName) return null;
    
    const isAvailable = (product.stock[storeName] || 0) > 0;
    
    return isAvailable ? (
      <div className="flex items-center">
        <Check className="h-4 w-4 text-green-500 mr-1" />
        <span>Disponible</span>
      </div>
    ) : (
      <div className="flex items-center">
        <X className="h-4 w-4 text-red-500 mr-1" />
        <span>No disponible</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
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
            <div className="flex items-center gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtros avanzados</span>
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <FileText className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                  <DialogDescription>
                    Complete los detalles del producto. Haga clic en guardar cuando termine.
                  </DialogDescription>
                </DialogHeader>
                <ProductForm
                  onSubmit={async (data) => {
                    try {
                      const { data: newProduct, error } = await supabase
                        .from("productos")
                        .insert({
                          nombre: data.name,
                          categoria_id: data.category,
                          unidad_id: data.unit,
                          precio_compra: data.purchasePrice,
                          precio_venta: data.salePrice,
                          stock_minimo: data.minStock,
                          stock_maximo: data.maxStock
                        })
                        .select();
                      
                      if (error) throw error;
                      
                      if (data.initialStock > 0 && data.warehouse) {
                        const { error: inventoryError } = await supabase
                          .from("inventario")
                          .insert({
                            producto_id: newProduct[0].id,
                            almacen_id: data.warehouse,
                            cantidad: data.initialStock
                          });
                        
                        if (inventoryError) throw inventoryError;
                      }
                      
                      const { data: productData, error: productError } = await supabase
                        .from("productos")
                        .select(`
                          id, nombre, precio_compra, precio_venta, stock_minimo, stock_maximo,
                          categorias(nombre),
                          unidades(nombre)
                        `)
                        .eq('id', newProduct[0].id)
                        .single();
                      
                      if (productError) throw productError;
                      
                      const warehouse = stores.find(store => store.id === data.warehouse)?.name || "";
                      
                      const newProductWithStock = {
                        id: productData.id,
                        nombre: productData.nombre,
                        categoria: productData.categorias ? productData.categorias.nombre : "Sin categoría",
                        categoria_id: data.category,
                        unidad: productData.unidades ? productData.unidades.nombre : "Unidad",
                        unidad_id: data.unit,
                        precio_compra: productData.precio_compra,
                        precio_venta: productData.precio_venta,
                        stock: data.initialStock > 0 ? { [warehouse]: data.initialStock } : {},
                        stock_minimo: productData.stock_minimo,
                        stock_maximo: productData.stock_maximo,
                      };
                      
                      setProducts(prev => [...prev, newProductWithStock]);
                      
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
                    
                    setIsAddDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p className="mt-2 text-sm">Cargando productos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="animate-fade-in">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="font-medium">{product.nombre}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.categoria}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>${product.precio_venta.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Costo: ${product.precio_compra.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {getTotalStock(product)} {product.unidad}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          En {Object.keys(product.stock).length} almacenes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getStockStatus(product) === "low"
                            ? "destructive"
                            : getStockStatus(product) === "high"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getStockStatus(product) === "low"
                          ? "Stock Bajo"
                          : getStockStatus(product) === "high"
                          ? "Sobrestock"
                          : "Normal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getAvailabilityDisplay(product)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStockUpdate(product)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-10 w-10 mb-2" />
                      <p className="text-base">No se encontraron productos</p>
                      <p className="text-sm">
                        Intente ajustar su búsqueda o filtros
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Mostrar
            </div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              productos por página
            </div>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map((pageNumber, index) => (
                <PaginationItem key={index}>
                  {pageNumber === 'ellipsis-start' || pageNumber === 'ellipsis-end' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink 
                      isActive={page === pageNumber}
                      onClick={() => typeof pageNumber === 'number' && setPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los detalles del producto. Haga clic en actualizar cuando termine.
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
              onSubmit={async (data) => {
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
                      stock_maximo: data.maxStock
                    })
                    .eq("id", selectedProduct.id);
                  
                  if (error) throw error;
                  
                  setProducts(prev => prev.map(product => {
                    if (product.id === selectedProduct.id) {
                      return {
                        ...product,
                        nombre: data.name,
                        categoria_id: data.category,
                        categoria: categories.find(cat => cat.id === data.category)?.name || "Sin categoría",
                        unidad_id: data.unit,
                        unidad: product.unidad,
                        precio_compra: data.purchasePrice,
                        precio_venta: data.salePrice,
                        stock_minimo: data.minStock,
                        stock_maximo: data.maxStock
                      };
                    }
                    return product;
                  }));
                  
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
                
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Stock</DialogTitle>
            <DialogDescription>
              Agregue stock al producto seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {selectedProduct?.nombre}
              </h3>
              <p className="text-sm text-muted-foreground">
                Stock actual: {selectedProduct ? getTotalStock(selectedProduct) : 0} {selectedProduct?.unidad}
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Cantidad a agregar
              </label>
              <Input
                id="quantity"
                type="number"
                value={newStockQuantity}
                onChange={(e) => setNewStockQuantity(Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="warehouse" className="text-sm font-medium">
                Almacén
              </label>
              <Select
                value={selectedStockWarehouse}
                onValueChange={setSelectedStockWarehouse}
              >
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Seleccione un almacén" />
                </SelectTrigger>
                <SelectContent>
                  {stores.filter(store => store.id !== "all").map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsStockDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveStockUpdate}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
