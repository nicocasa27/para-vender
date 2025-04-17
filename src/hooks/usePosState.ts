
import { useState, useEffect } from "react";
import { Product } from "@/types/inventory";
import { CartItem, productToCartItem } from "@/types/cart";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { useSales } from "@/hooks/useSales";

// Claves para localStorage
const CART_STORAGE_KEY = "pos_cart_items";
const SELECTED_STORE_KEY = "pos_selected_store";
const PAYMENT_METHOD_KEY = "pos_payment_method";
const CASH_RECEIVED_KEY = "pos_cash_received";

export function usePosState() {
  // Recuperar valores del localStorage o usar valores predeterminados
  const getStoredCart = (): CartItem[] => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Error al recuperar carrito del localStorage:", error);
      return [];
    }
  };

  const getStoredStore = (): string | undefined => {
    try {
      return localStorage.getItem(SELECTED_STORE_KEY) || undefined;
    } catch (error) {
      console.error("Error al recuperar sucursal del localStorage:", error);
      return undefined;
    }
  };

  const getStoredPaymentMethod = (): string => {
    try {
      return localStorage.getItem(PAYMENT_METHOD_KEY) || "efectivo";
    } catch (error) {
      console.error("Error al recuperar método de pago del localStorage:", error);
      return "efectivo";
    }
  };

  const getStoredCashReceived = (): string => {
    try {
      return localStorage.getItem(CASH_RECEIVED_KEY) || "";
    } catch (error) {
      console.error("Error al recuperar monto recibido del localStorage:", error);
      return "";
    }
  };

  // Estado con valores iniciales desde localStorage
  const [selectedStore, setSelectedStore] = useState<string | undefined>(getStoredStore());
  const [cartItems, setCartItems] = useState<CartItem[]>(getStoredCart());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(getStoredPaymentMethod());
  const [cashReceived, setCashReceived] = useState<string>(getStoredCashReceived());
  const [isViewer, setIsViewer] = useState(false);
  const { user, hasRole } = useAuth();
  const { processNewSale, loading } = useSales();

  // Guardar en localStorage cuando cambien los valores
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error al guardar carrito en localStorage:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (selectedStore) {
        localStorage.setItem(SELECTED_STORE_KEY, selectedStore);
      }
    } catch (error) {
      console.error("Error al guardar sucursal en localStorage:", error);
    }
  }, [selectedStore]);

  useEffect(() => {
    try {
      localStorage.setItem(PAYMENT_METHOD_KEY, paymentMethod);
    } catch (error) {
      console.error("Error al guardar método de pago en localStorage:", error);
    }
  }, [paymentMethod]);

  useEffect(() => {
    try {
      localStorage.setItem(CASH_RECEIVED_KEY, cashReceived);
    } catch (error) {
      console.error("Error al guardar monto recibido en localStorage:", error);
    }
  }, [cashReceived]);

  // Verificar los roles de usuario
  useEffect(() => {
    if (user) {
      const isAdmin = hasRole("admin");
      const isManager = hasRole("manager");
      const hasViewerRole = hasRole("viewer");
      
      // Solo configurar como viewer si SOLO tiene ese rol y no los otros
      setIsViewer(hasViewerRole && !isAdmin && !isManager);
    }
  }, [user, hasRole]);

  // Función para seleccionar producto
  const handleProductSelect = (product: Product) => {
    // Prevenir que los viewers agreguen productos
    if (isViewer) {
      toast.error("No tienes permiso para realizar ventas", {
        description: "Tu rol de 'viewer' solo permite visualizar información"
      });
      return;
    }
    
    setSelectedProduct(product);
    addProductToCart(product);
  };

  // Función para añadir producto al carrito
  const addProductToCart = (product: Product) => {
    // Verificación adicional para viewers
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

  // Función para actualizar cantidad de producto en carrito
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    // Prevenir que los viewers modifiquen el carrito
    if (isViewer) return;
    
    const updatedCartItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, cantidad: newQuantity } : item
    );
    setCartItems(updatedCartItems);
  };

  // Función para eliminar producto del carrito
  const removeCartItem = (itemId: string) => {
    // Prevenir que los viewers modifiquen el carrito
    if (isViewer) return;
    
    const updatedCartItems = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCartItems);
  };

  // Función para vaciar carrito
  const clearCart = () => {
    // Prevenir que los viewers modifiquen el carrito
    if (isViewer) return;
    
    setCartItems([]);
    setPaymentMethod("efectivo");
    setCashReceived("");

    // Limpiar localStorage relacionado con el carrito
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(PAYMENT_METHOD_KEY);
      localStorage.removeItem(CASH_RECEIVED_KEY);
    } catch (error) {
      console.error("Error al limpiar localStorage:", error);
    }
  };

  // Función para calcular total
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.cantidad, 0);
  };

  // Función para calcular cambio
  const calculateChange = () => {
    const total = calculateTotal();
    const cash = parseFloat(cashReceived);
    if (!isNaN(cash) && cash >= total) {
      return (cash - total).toFixed(2);
    }
    return "0.00";
  };

  // Manejador para cambio en monto recibido
  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números y un punto decimal
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCashReceived(value);
  };

  // Función para confirmar venta
  const handleConfirmSale = async () => {
    // Prevenir que los viewers confirmen ventas
    if (isViewer) {
      toast.error("No tienes permiso para realizar ventas", {
        description: "Tu rol de 'viewer' solo permite visualizar información"
      });
      return;
    }
    
    // Validaciones antes de procesar la venta
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
