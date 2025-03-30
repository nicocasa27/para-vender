import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCard } from "./ProductCard";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  // Ya no incluimos stock_total porque daba error
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio_venta"); // 🔧 stock_total eliminado

      if (error) {
        console.error("Error al cargar productos:", error);
        setProducts([]);
      } else {
        setProducts(data as Product[]);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader>
        <CardTitle className="text-base font-medium">Productos</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-muted-foreground">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-muted-foreground">No hay productos disponibles</div>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.nombre}
              price={product.precio_venta}
              stock={0} // Puedes reemplazar con el stock real cuando lo tengas
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
