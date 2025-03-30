import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentStores } from "@/hooks/useCurrentStores"; // ✅ nuevo hook
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_total: number;
  almacen_id: string;
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { storeIds, isLoading: isStoresLoading } = useCurrentStores();

  useEffect(() => {
    if (isStoresLoading || storeIds.length === 0) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("id, nombre, precio_venta, stock_total, almacen_id")
          .in("almacen_id", storeIds);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeIds, isStoresLoading]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-muted-foreground">No hay productos disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
