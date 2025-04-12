
import { useState, useEffect } from "react";
import { Product } from "@/types/inventory";
import { CartItem, productToCartItem } from "@/types/cart";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { useSales } from "@/hooks/useSales";

export function usePosState() {
  const [selectedStore, setSelectedStore] = useState<string | undefined>(undefined);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isViewer, setIsViewer] = useState(false);
  const { user, hasRole } = useAuth();
  const { processNewSale, loading } = useSales();

  // Check user roles
  useEffect(() => {
    if (user) {
      const isAdmin = hasRole("admin");
      const isManager = hasRole("manager");
      const hasViewerRole = hasRole("viewer");
      
      // Solo configurar como viewer si SOLO tiene ese rol y no los otros
      setIsViewer(hasViewerRole && !isAdmin && !isManager);
    }
  }, [user, hasRole]);

  const handleProductSelect = (product: Product) => {
    // Prevent viewers from adding products
    if (isViewer) {
      toast.error("No tienes permiso para realizar ventas", {
        description: "Tu rol de 'viewer' solo permite visualizar información"
      });
      return;
    }
    
    setSelectedProduct(product);
    addProductToCart(product);
  };

  const addProductToCart = (product: Product) => {
    // Double check viewer restriction
    if (isViewer) return;
    
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
    // Prevent viewers from modifying cart
    if (isViewer) return;
    
    const updatedCartItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, cantidad: newQuantity } : item
    );
    setCartItems(updatedCartItems);
  };

  const removeCartItem = (itemId: string) => {
    // Prevent viewers from modifying cart
    if (isViewer) return;
    
    const updatedCartItems = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCartItems);
  };

  const clearCart = () => {
    // Prevent viewers from modifying cart
    if (isViewer) return;
    
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
    // Prevent viewers from confirming sales
    if (isViewer) {
      toast.error("No tienes permiso para realizar ventas", {
        description: "Tu rol de 'viewer' solo permite visualizar información"
      });
      return;
    }
    
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

  return {
    selectedStore,
    setSelectedStore,
    cartItems,
    selectedProduct,
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    isViewer,
    loading,
    handleProductSelect,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    calculateTotal,
    calculateChange,
    handleCashReceivedChange,
    handleConfirmSale
  };
}
