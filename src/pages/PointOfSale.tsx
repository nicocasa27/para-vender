
import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const PointOfSale = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const handleProductSelect = (product: { id: number; name: string; price: number; stock: number }) => {
    setCartItems((prevItems) => {
      // Check if the product is already in the cart
      const existingItemIndex = prevItems.findIndex((item) => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // If the product is already in the cart, update quantity if not exceeding stock
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
            title: "Maximum stock reached",
            description: `You've reached the maximum available stock for ${product.name}.`,
          });
          return prevItems;
        }
      } else {
        // If the product is not in the cart, add it with quantity 1
        toast({
          title: "Product added",
          description: `${product.name} has been added to the cart.`,
        });
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    toast({
      title: "Product removed",
      description: "The product has been removed from the cart.",
    });
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    setCartItems([]);
    toast({
      title: "Cart cleared",
      description: "All products have been removed from the cart.",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
        <p className="text-muted-foreground mt-2">
          Process sales quickly and efficiently with our integrated POS system.
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
