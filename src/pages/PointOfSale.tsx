import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { useStores } from "@/hooks/useStores";
import { Product } from "@/types/inventory";
import { CartItem, productToCartItem } from "@/types/cart";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function PointOfSale() {
  const [selectedStore, setSelectedStore] = useState<string | undefined>(undefined);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { stores } = useStores();
  const { user, hasRole } = useAuth();
  const [isSales, setIsSales] = useState(false);

  useEffect(() => {
    if (user) {
      setIsSales(hasRole("sales", selectedStore));
    }
  }, [user, hasRole, selectedStore]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    addProductToCart(product);
  };

  const addProductToCart = (product: Product) => {
    const existingCartItemIndex = cartItems.findIndex((item) => item.id === product.id);

    if (existingCartItemIndex !== -1) {
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingCartItemIndex].cantidad += 1;
      setCartItems(updatedCartItems);
    } else {
      const newCartItem: CartItem = productToCartItem(product);
      setCartItems([...cartItems, newCartItem]);
    }
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    const updatedCartItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, cantidad: newQuantity } : item
    );
    setCartItems(updatedCartItems);
  };

  const removeCartItem = (itemId: string) => {
    const updatedCartItems = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.cantidad, 0);
  };

  const handleConfirmSale = async () => {
    if (cartItems.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    if (!selectedStore) {
      toast.error("Debes seleccionar una sucursal");
      return;
    }

    try {
      // Crear la venta
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([
          {
            almacen_id: selectedStore,
            total: calculateTotal(),
            fecha: new Date().toISOString(),
            usuario_id: user?.id
          }
        ])
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Crear los detalles de la venta
      const detallesVenta = cartItems.map(item => ({
        venta_id: venta.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      }));

      const { error: detallesError } = await supabase
        .from('detalles_venta')
        .insert(detallesVenta);

      if (detallesError) throw detallesError;

      // Actualizar el inventario (restar cantidades)
      for (const item of cartItems) {
        const { error: inventarioError } = await supabase
          .from('inventario')
          .update({ cantidad: item.stock - item.cantidad })
          .eq('almacen_id', selectedStore)
          .eq('producto_id', item.id);

        if (inventarioError) throw inventarioError;
      }

      toast.success("Venta confirmada correctamente");
      clearCart();
    } catch (error: any) {
      console.error("Error al confirmar la venta:", error);
      toast.error("Error al confirmar la venta", {
        description: error.message
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Punto de Venta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="mb-4">
            <Select onValueChange={(value) => setSelectedStore(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar Sucursal" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="products" className="space-y-4">
            <TabsList>
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="cart">Carrito</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              {selectedStore ? (
                <ProductGrid onProductSelect={handleProductSelect} selectedStore={selectedStore} />
              ) : (
                <div className="text-center p-4">Selecciona una sucursal para ver los productos.</div>
              )}
            </TabsContent>
            <TabsContent value="cart">
              <Cart
                cartItems={cartItems}
                updateCartItemQuantity={updateCartItemQuantity}
                removeCartItem={removeCartItem}
                clearCart={clearCart}
                calculateTotal={calculateTotal}
              />
              <Button onClick={handleConfirmSale} disabled={cartItems.length === 0 || !selectedStore}>
                Confirmar Venta
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
