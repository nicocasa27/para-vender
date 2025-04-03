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
import { useStores } from "@/hooks/useStores";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  stock: number;
  unidad: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface ProductGridProps {
  onProductSelect: (product: { id: string; name: string; price: number; stock: number }) => void;
  selectedStore: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ onProductSelect, selectedStore }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const { data, error } = await supabase.from("categorias").select("id, nombre");
        if (error) throw error;
        setCategorias(data || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        setError("No se pudieron cargar las categorías");
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
    if (!selectedStore) {
      setCargando(false);
      setProductos([]);
      return;
    }
    
    const fetchProductos = async () => {
      setCargando(true);
      setError(null);
      
      try {
        console.log("Fetching products for store:", selectedStore);
        
        // Step 1: Get all products
        const { data: productsData, error: productsError } = await supabase
          .from("productos")
          .select(`
            id, 
            nombre, 
            precio_venta,
            categorias(id, nombre),
            unidades(id, abreviatura)
          `);

        if (productsError) throw productsError;
        
        if (!productsData || productsData.length === 0) {
          console.log("No products found");
          setProductos([]);
          setCargando(false);
          return;
        }
        
        console.log(`Found ${productsData.length} products, fetching inventory`);
        
        // Step 2: Get inventory for selected store
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventario")
          .select("producto_id, cantidad")
          .eq("almacen_id", selectedStore);
          
        if (inventoryError) throw inventoryError;
        
        // Create a map of product_id to stock quantity
        const inventoryMap = new Map();
        if (inventoryData) {
          inventoryData.forEach(item => {
            inventoryMap.set(item.producto_id, Number(item.cantidad) || 0);
          });
        }
        
        // Combine product data with inventory data
        const productosConStock = productsData.map(producto => {
          return {
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categorias?.nombre || "Sin categoría",
            precio_venta: Number(producto.precio_venta) || 0,
            stock: inventoryMap.get(producto.id) || 0,
            unidad: producto.unidades?.abreviatura || "u",
          };
        });
        
        console.log(`Processed ${productosConStock.length} products with stock information`);
        setProductos(productosConStock);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        setError("No se pudieron cargar los productos");
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
    } else {
      toast({
        title: "Sin stock",
        description: `${producto.nombre} no tiene existencias disponibles.`,
        variant: "destructive",
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
              {categorias
                .filter(categoria => !!categoria.id && categoria.nombre && categoria.id !== "")
                .map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.nombre.toLowerCase() || "categoria-sin-nombre"}>
                    {categoria.nombre || "Sin nombre"}
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
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 mb-3 text-destructive" />
            <p className="text-lg font-medium text-destructive">Error al cargar productos</p>
            <p className="text-sm text-center max-w-md mt-2">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Intentar nuevamente
            </Button>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm text-center max-w-md mt-2">
              {productos.length === 0 
                ? "No hay productos disponibles en esta sucursal." 
                : "Intente con otros términos de búsqueda o categoría."}
            </p>
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
                <CardContent className="p-4">
                  <div className="font-medium truncate mb-2">{producto.nombre}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">${producto.precio_venta.toFixed(2)}</span>
                    <Badge variant={producto.stock <= 0 ? "destructive" : "outline"}>
                      {producto.stock <= 0 ? "Sin stock" : `${producto.stock} ${producto.unidad}`}
                    </Badge>
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
