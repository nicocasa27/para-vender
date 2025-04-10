import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/inventory";
import { CartItem } from "@/pages/PointOfSale";

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

        setProducts(data || []);
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
                {product.categorias?.nombre || "Sin categoría"}
              </div>
              <div className="text-xs text-muted-foreground">
                {product.unidades?.abreviatura || "u"}
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
