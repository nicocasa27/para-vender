
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
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  Search,
  Package,
  Filter,
  Plus,
  Edit,
  Trash,
  FileText
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

interface ProductWithStock {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 5;

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
            categorias(nombre),
            unidades(nombre)
          `);
        
        if (productsError) throw productsError;
        
        // Obtener inventario para cada producto
        const productsWithStock = await Promise.all(
          productsData.map(async (product) => {
            const { data: inventoryData, error: inventoryError } = await supabase
              .from("inventario")
              .select(`
                cantidad,
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
              unidad: product.unidades ? product.unidades.nombre : "Unidad",
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

  const getTotalStock = (product: ProductWithStock) => {
    return Object.values(product.stock).reduce((acc, curr) => acc + Number(curr), 0);
  };

  const getStockStatus = (product: ProductWithStock) => {
    const totalStock = getTotalStock(product);
    if (totalStock <= product.stock_minimo) return "low";
    if (totalStock >= product.stock_maximo) return "high";
    return "normal";
  };

  // Filtrar productos basados en búsqueda, categoría y almacén
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.categoria.toLowerCase() === categories.find(cat => cat.id === selectedCategory)?.name.toLowerCase();
    const matchesStore =
      selectedStore === "all" ||
      product.stock[
        stores.find((store) => store.id === selectedStore)?.name || ""
      ] !== undefined;
    return matchesSearch && matchesCategory && matchesStore;
  });

  // Paginar productos
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
                      // Insertar nuevo producto
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
                      
                      // Registrar inventario inicial si se especificó
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
                      
                      // Obtener datos para mostrar el producto
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
                      
                      // Obtener el almacén para el stock inicial
                      const warehouse = stores.find(store => store.id === data.warehouse)?.name || "";
                      
                      // Agregar a la lista de productos
                      const newProductWithStock = {
                        id: productData.id,
                        nombre: productData.nombre,
                        categoria: productData.categorias ? productData.categorias.nombre : "Sin categoría",
                        unidad: productData.unidades ? productData.unidades.nombre : "Unidad",
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
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
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
                  <TableCell colSpan={6} className="text-center py-6">
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
          <div className="text-sm text-muted-foreground">
            Mostrando {Math.min(filteredProducts.length, page * itemsPerPage) - ((page - 1) * itemsPerPage)} de{" "}
            {filteredProducts.length} productos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {page} de {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
