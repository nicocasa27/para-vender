
import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const PointOfSale = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const handleProductSelect = (product: { id: string; name: string; price: number; stock: number }) => {
    setCartItems((prevItems) => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = prevItems.findIndex((item) => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Si el producto ya está en el carrito, actualizar la cantidad si no excede el stock
        const existingItem = prevItems[existingItemIndex];
        if (existingItem.quantity < product.stock) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };
          return updatedItems;
        } else {
          toast({
            title: "Stock máximo alcanzado",
            description: `Has alcanzado el stock máximo disponible para ${product.name}.`,
          });
          return prevItems;
        }
      } else {
        // Si el producto no está en el carrito, agregarlo con cantidad 1
        toast({
          title: "Producto agregado",
          description: `${product.name} ha sido agregado al carrito.`,
        });
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    toast({
      title: "Producto eliminado",
      description: "El producto ha sido eliminado del carrito.",
    });
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    setCartItems([]);
    toast({
      title: "Carrito vacío",
      description: "Todos los productos han sido eliminados del carrito.",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Punto de Venta</h2>
        <p className="text-muted-foreground mt-2">
          Procese ventas rápida y eficientemente con nuestro sistema de punto de venta integrado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-[calc(100vh-14rem)]">
        <div className="lg:col-span-2 h-full">
          <ProductGrid onProductSelect={handleProductSelect} />
        </div>
        <div className="h-full">
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
