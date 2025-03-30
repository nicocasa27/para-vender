import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStores } from "@/hooks/useCurrentStores"; // 🔥 aquí está la magia

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_total: number;
  almacen_id: string;
}

const PointOfSale = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { storeIds, isLoading } = useCurrentStores();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading || storeIds.length === 0) return;

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio_venta, stock_total, almacen_id")
        .in("almacen_id", storeIds);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos.",
          variant: "destructive",
        });
        return;
      }

      setProducts(data || []);
    };

    fetchProducts();
  }, [storeIds, isLoading]);

  const handleProductSelect = (product: Product) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex >= 0) {
        const existingItem = prevItems[existingIndex];
        if (existingItem.quantity < product.stock_total) {
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };
          return updated;
        } else {
          toast({
            title: "Stock máximo alcanzado",
            description: `${product.nombre} ya alcanzó el stock máximo.`,
          });
          return prevItems;
        }
      } else {
        toast({
          title: "Producto agregado",
          description: `${product.nombre} añadido al carrito.`,
        });
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.nombre,
            price: product.precio_venta,
            stock: product.stock_total,
            quantity: 1,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
    toast({ title: "Producto eliminado" });
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast({ title: "Carrito vacío", description: "Se removieron todos los productos." });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <ProductGrid products={products} onSelect={handleProductSelect} />
      <Cart
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        onClear={handleClearCart}
      />
    </div>
  );
};

export default PointOfSale;
