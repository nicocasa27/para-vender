
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/inventory";
import { CartItem, productToCartItem } from "@/types/cart";

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
        const { data, error } = await supabase
          .from('productos')
          .select(`
            id,
            nombre,
            precio_venta,
            categorias (id, nombre),
            unidades (id, abreviatura)
          `);

        if (error) throw error;

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
        const transformedProducts = data?.map(item => {
          // Safely access nested properties
          const categoria = Array.isArray(item.categorias) && item.categorias.length > 0 
            ? item.categorias[0]?.nombre || 'Sin categoría'
            : 'Sin categoría';
          
          const categoriaId = Array.isArray(item.categorias) && item.categorias.length > 0
            ? item.categorias[0]?.id
            : undefined;
            
          const unidad = Array.isArray(item.unidades) && item.unidades.length > 0
            ? item.unidades[0]?.abreviatura || 'u'
            : 'u';
            
          const unidadId = Array.isArray(item.unidades) && item.unidades.length > 0
            ? item.unidades[0]?.id
            : undefined;

          return {
            id: item.id || '',
            nombre: item.nombre || '',
            precio_venta: Number(item.precio_venta) || 0,
            stock_total: inventoryMap.get(item.id) || 0,
            categoria: categoria,
            unidad: unidad,
            // Add other required fields with default values
            precio_compra: 0,
            stock_minimo: 0,
            stock_maximo: 0,
            categoria_id: categoriaId,
            unidad_id: unidadId,
            inventario: []
          } as Product;
        });

        setProducts(transformedProducts || []);
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
    onProductSelect(product);
  };

  if (loading) {
    return <div className="text-center p-4">Cargando productos...</div>;
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="cursor-pointer">
            <CardContent className="p-2 flex flex-col items-center">
              <div className="text-sm font-semibold">{product.nombre}</div>
              <div className="text-xs text-muted-foreground">
                <Tag className="h-3 w-3 mr-1 inline-block" />
                {product.categoria || "Sin categoría"}
              </div>
              <div className="text-xs text-muted-foreground">
                {product.unidad || "u"}
              </div>
              <div className="text-lg font-bold">${product.precio_venta}</div>
              <Button size="sm" onClick={() => handleProductSelect(product)}>
                Añadir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
