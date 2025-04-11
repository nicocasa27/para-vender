
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
import { useSales } from "@/hooks/useSales";
import { Label } from "@/components/ui/label";
import { ShoppingCart, CreditCard, Banknote } from "lucide-react";

export default function PointOfSale() {
  const [selectedStore, setSelectedStore] = useState<string | undefined>(undefined);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const { stores } = useStores();
  const { user, hasRole } = useAuth();
  const [isSales, setIsSales] = useState(false);
  const { processNewSale, loading } = useSales();

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
    setCustomerName("");
    setPaymentMethod("efectivo");
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
      // Usar el hook useSales para procesar la venta
      const success = await processNewSale(
        cartItems, 
        selectedStore, 
        paymentMethod, 
        customerName || undefined
      );
      
      if (success) {
        clearCart();
        toast.success("Venta completada con éxito");
      }
    } catch (error: any) {
      console.error("Error al confirmar la venta:", error);
      toast.error(`Error al procesar la venta: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Punto de Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="mb-4">
            <Select onValueChange={(value) => setSelectedStore(value)} value={selectedStore}>
              <SelectTrigger className="w-full sm:w-[300px]">
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
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="cart">Carrito</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              {selectedStore ? (
                <ProductGrid onProductSelect={handleProductSelect} selectedStore={selectedStore} />
              ) : (
                <div className="text-center p-8 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Selecciona una sucursal</h3>
                  <p className="text-muted-foreground">Selecciona una sucursal para ver los productos disponibles.</p>
                </div>
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
              
              <div className="mt-6 grid gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="customerName">Nombre del Cliente (opcional)</Label>
                  <Input 
                    id="customerName" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Cliente Anónimo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          <span>Efectivo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tarjeta">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Tarjeta</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="mt-4" 
                  onClick={handleConfirmSale} 
                  disabled={cartItems.length === 0 || !selectedStore || loading}
                >
                  {loading ? "Procesando..." : "Confirmar Venta"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
