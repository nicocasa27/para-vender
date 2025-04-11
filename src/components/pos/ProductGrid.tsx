
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Tag, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/inventory";
import { formatQuantityWithUnit } from "@/utils/inventory/formatters";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
  selectedStore: string;
}

export function ProductGrid({ onProductSelect, selectedStore }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedStore) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Obtenemos los productos directamente con sus detalles
        const { data: productsData, error: productsError } = await supabase
          .from('productos')
          .select(`
            id,
            nombre,
            precio_venta,
            categoria_id,
            unidad_id
          `);

        if (productsError) throw productsError;

        // Obtenemos las categorías y unidades para enriquecer los datos
        const [categoriesResponse, unitsResponse] = await Promise.all([
          supabase.from('categorias').select('id, nombre'),
          supabase.from('unidades').select('id, nombre, abreviatura')
        ]);

        // Creamos mapas para búsquedas rápidas
        const categoriesMap = new Map();
        const unitsMap = new Map();

        if (categoriesResponse.data) {
          categoriesResponse.data.forEach(cat => categoriesMap.set(cat.id, cat.nombre));
        }

        if (unitsResponse.data) {
          unitsResponse.data.forEach(unit => unitsMap.set(unit.id, unit.abreviatura || unit.nombre));
        }

        // Get inventory data for this store
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventario')
          .select('producto_id, cantidad')
          .eq('almacen_id', selectedStore);

        if (inventoryError) throw inventoryError;

        // Map inventory data
        const inventoryMap = new Map();
        if (inventoryData) {
          inventoryData.forEach((item) => {
            inventoryMap.set(item.producto_id, Number(item.cantidad || 0));
          });
        }

        // Transform data to match Product type
        const transformedProducts = productsData?.map(item => {
          const categoria = categoriesMap.get(item.categoria_id) || 'Sin categoría';
          const unidad = unitsMap.get(item.unidad_id) || 'u';
          
          return {
            id: item.id || '',
            nombre: item.nombre || '',
            precio_venta: Number(item.precio_venta) || 0,
            stock_total: inventoryMap.get(item.id) || 0,
            categoria: categoria,
            unidad: unidad,
            categoria_id: item.categoria_id,
            unidad_id: item.unidad_id,
            precio_compra: 0,
            stock_minimo: 0,
            stock_maximo: 0,
            inventario: [{ 
              almacen_id: selectedStore,
              cantidad: inventoryMap.get(item.id) || 0 
            }]
          } as Product;
        });

        // Filtrar productos sin stock
        const productsWithStock = transformedProducts?.filter(p => p.stock_total > 0) || [];
        setProducts(productsWithStock);
      } catch (error: any) {
        console.error("Error al cargar productos:", error.message);
        toast.error("Error al cargar productos");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedStore]);

  const filteredProducts = products.filter((product) =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    if (product.stock_total <= 0) {
      toast.error("Producto sin existencias");
      return;
    }
    onProductSelect(product);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-4 flex items-center">
          <Skeleton className="h-10 w-full mr-2" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-lg">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay productos disponibles</h3>
        <p className="text-muted-foreground">No se encontraron productos con existencias en esta sucursal.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center p-8 bg-muted/30 rounded-lg">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin resultados</h3>
          <p className="text-muted-foreground">No se encontraron productos que coincidan con "{searchTerm}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={`cursor-pointer hover:shadow-md transition-all ${product.stock_total <= 0 ? 'opacity-50' : ''}`}>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-lg font-medium mt-2 text-center">{product.nombre}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Tag className="h-3 w-3 mr-1 inline-block" />
                  {product.categoria}
                </div>
                <div className="text-sm mt-1 font-semibold">
                  Stock: {formatQuantityWithUnit(product.stock_total, product.unidad)}
                </div>
                <div className="text-xl font-bold mt-2 text-primary">${product.precio_venta.toFixed(2)}</div>
                <Button 
                  size="sm" 
                  className="mt-3 w-full" 
                  onClick={() => handleProductSelect(product)}
                  disabled={product.stock_total <= 0}
                >
                  Añadir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
