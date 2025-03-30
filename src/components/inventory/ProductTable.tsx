import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/inventory";
import { ProductCard } from "./ProductCard";

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("productos").select(`
        id,
        nombre,
        precio_venta,
        stock_total,
        almacen_id
      `);

      if (error) {
        console.error("Error al cargar productos:", error.message);
        return;
      }

      setProducts(data ?? []);
    };

    fetchProducts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
