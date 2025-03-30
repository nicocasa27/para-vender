
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/inventory";
import { ProductCard } from "./ProductCard";

// Changed from 'export function ProductTable()' to explicitly assign the named export
const ProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("productos").select(`
        id,
        nombre,
        precio_venta,
        stock_total,
        almacen_id
      `);

      if (error) {
        console.error("Error al cargar productos:", error.message);
        setLoading(false);
        return;
      }

      setProducts(data ?? []);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <div className="col-span-3 text-center p-8 text-muted-foreground">
          No hay productos disponibles.
        </div>
      )}
    </div>
  );
};

// Export the component correctly
export { ProductTable };
