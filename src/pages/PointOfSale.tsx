
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ShoppingCart, CreditCard, Banknote } from "lucide-react";

export default function PointOfSale() {
  const [selectedStore, setSelectedStore] = useState<string | undefined>(undefined);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [cashReceived, setCashReceived] = useState<string>("");
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
    setPaymentMethod("efectivo");
    setCashReceived("");
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.cantidad, 0);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash) && cash >= total) {
      return (cash - total).toFixed(2);
    }
    return "0.00";
  };

  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números y un punto decimal
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCashReceived(value);
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

    if (paymentMethod === "efectivo") {
      const cash = parseFloat(cashReceived);
      const total = calculateTotal();
      
      if (isNaN(cash) || cash < total) {
        toast.error("El monto recibido es insuficiente");
        return;
      }
    }

    try {
      // Usar el hook useSales para procesar la venta
      const success = await processNewSale(
        cartItems, 
        selectedStore, 
        paymentMethod
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
        <CardContent>
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

          {selectedStore ? (
            <div className="space-y-6">
              {/* Sección de Productos - Ahora está arriba */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Productos</h2>
                <ProductGrid onProductSelect={handleProductSelect} selectedStore={selectedStore} />
              </div>
              
              {/* Sección de Carrito y Pago - Ahora está abajo */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Carrito</h2>
                <Cart
                  cartItems={cartItems}
                  updateCartItemQuantity={updateCartItemQuantity}
                  removeCartItem={removeCartItem}
                  clearCart={clearCart}
                  calculateTotal={calculateTotal}
                />
                
                {cartItems.length > 0 && (
                  <div className="mt-6 p-4 border rounded-lg space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Método de Pago</h3>
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
                    
                    {paymentMethod === "efectivo" && (
                      <div className="p-3 bg-gray-50 rounded-md space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Monto recibido:</p>
                          <div className="flex items-center">
                            <span className="text-lg mr-2">$</span>
                            <Input
                              type="text"
                              value={cashReceived}
                              onChange={handleCashReceivedChange}
                              placeholder="0.00"
                              className="text-lg"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <p className="font-medium">Total:</p>
                          <p className="text-xl font-bold">${calculateTotal().toFixed(2)}</p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <p className="font-medium">Cambio:</p>
                          <p className="text-xl font-bold text-green-600">${calculateChange()}</p>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleConfirmSale} 
                      disabled={loading || (paymentMethod === "efectivo" && (parseFloat(cashReceived) < calculateTotal() || isNaN(parseFloat(cashReceived))))}
                    >
                      {loading ? "Procesando..." : "Confirmar Venta"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Selecciona una sucursal</h3>
              <p className="text-muted-foreground">Selecciona una sucursal para ver los productos disponibles.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
