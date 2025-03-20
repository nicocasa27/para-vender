import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  stock: number;
  imagen: string;
  unidad: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Almacen {
  id: string;
  nombre: string;
}

interface ProductGridProps {
  onProductSelect: (product: { id: string; name: string; price: number; stock: number }) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedStore, setSelectedStore] = useState("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [cargando, setCargando] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const { data, error } = await supabase.from("categorias").select("id, nombre");
        if (error) throw error;
        setCategorias(data || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        });
      }
    };

    fetchCategorias();
  }, [toast]);

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const { data, error } = await supabase.from("almacenes").select("id, nombre");
        if (error) throw error;
        setAlmacenes(data || []);
      } catch (error) {
        console.error("Error al cargar almacenes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los almacenes",
          variant: "destructive",
        });
      }
    };

    fetchAlmacenes();
  }, [toast]);

  useEffect(() => {
    const fetchProductos = async () => {
      setCargando(true);
      try {
        const { data, error } = await supabase
          .from("productos")
          .select(`
            id, 
            nombre, 
            precio_venta,
            stock_minimo,
            stock_maximo,
            categorias(id, nombre),
            unidades(id, nombre, abreviatura)
          `);

        if (error) throw error;

        if (data) {
          const productosConStock = await Promise.all(
            data.map(async (producto) => {
              let stockTotal = 0;

              if (selectedStore !== "todos") {
                const { data: inventarioData, error: inventarioError } = await supabase
                  .from("inventario")
                  .select("cantidad")
                  .eq("producto_id", producto.id)
                  .eq("almacen_id", selectedStore)
                  .single();

                if (!inventarioError && inventarioData) {
                  stockTotal = inventarioData.cantidad;
                }
              } else {
                const { data: inventarioData, error: inventarioError } = await supabase
                  .from("inventario")
                  .select("cantidad")
                  .eq("producto_id", producto.id);

                if (!inventarioError && inventarioData) {
                  stockTotal = inventarioData.reduce((sum, item) => sum + Number(item.cantidad), 0);
                }
              }

              return {
                id: producto.id,
                nombre: producto.nombre,
                categoria: producto.categorias?.nombre || "Sin categoría",
                precio_venta: Number(producto.precio_venta),
                stock: stockTotal,
                imagen: "/placeholder.svg",
                unidad: producto.unidades?.abreviatura || "u",
              };
            })
          );

          setProductos(productosConStock);
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, [selectedStore, toast]);

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch = producto.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "todas" ||
      producto.categoria.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (producto: Producto) => {
    if (producto.stock > 0) {
      onProductSelect({
        id: producto.id,
        name: producto.nombre,
        price: producto.precio_venta,
        stock: producto.stock
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.nombre.toLowerCase()}>
                  {categoria.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={selectedStore}
            onValueChange={setSelectedStore}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Almacenes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los almacenes</SelectItem>
              {almacenes.map((almacen) => (
                <SelectItem key={almacen.id} value={almacen.id}>
                  {almacen.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs 
            defaultValue="grid" 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as "grid" | "list")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Cuadrícula</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {cargando ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-lg font-medium">Cargando productos...</p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm">Intente con otros términos de búsqueda o categoría</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProductos.map((producto) => (
              <Card
                key={producto.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  producto.stock <= 0 && "opacity-60"
                )}
                onClick={() => handleProductClick(producto)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                    {producto.stock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-t-lg">
                        <span className="text-white font-semibold">Sin Existencias</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-medium truncate">{producto.nombre}</div>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="text-lg font-bold">${producto.precio_venta.toFixed(2)}</span>
                      <Badge variant="outline">
                        Stock: {producto.stock} {producto.unidad}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2 p-1">
            {filteredProductos.map((producto) => (
              <div
                key={producto.id}
                className={cn(
                  "flex items-center p-3 rounded-lg border cursor-pointer hover:bg-accent/20 transition-colors",
                  producto.stock <= 0 && "opacity-60"
                )}
                onClick={() => handleProductClick(producto)}
              >
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="object-cover w-full h-full rounded-md"
                  />
                </div>
                <div className="flex-1 mr-4">
                  <div className="font-medium">{producto.nombre}</div>
                  <div className="text-sm text-muted-foreground">{producto.categoria}</div>
                </div>
                <div className="flex items-center">
                  <div className="font-bold mr-4">${producto.precio_venta.toFixed(2)}</div>
                  <Badge variant={producto.stock <= 0 ? "destructive" : "outline"}>
                    {producto.stock <= 0 ? "Sin existencias" : `${producto.stock} ${producto.unidad}`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
