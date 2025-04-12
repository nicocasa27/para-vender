
import React from 'react';
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { PaymentSection } from "@/components/pos/PaymentSection";
import { Product } from "@/types/inventory";
import { CartItem } from "@/types/cart";

interface PointOfSaleContentProps {
  selectedStore: string;
  cartItems: CartItem[];
  updateCartItemQuantity: (itemId: string, newQuantity: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  handleProductSelect: (product: Product) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  cashReceived: string;
  handleCashReceivedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  calculateChange: () => string;
  handleConfirmSale: () => void;
  loading: boolean;
  isViewer: boolean;
}

export function PointOfSaleContent({
  selectedStore,
  cartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  calculateTotal,
  handleProductSelect,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  handleCashReceivedChange,
  calculateChange,
  handleConfirmSale,
  loading,
  isViewer
}: PointOfSaleContentProps) {
  return (
    <div className="space-y-6">
      {/* Sección de Productos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Productos</h2>
        <ProductGrid onProductSelect={handleProductSelect} selectedStore={selectedStore} />
      </div>
      
      {/* Sección de Carrito y Pago */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Carrito</h2>
        <Cart
          cartItems={cartItems}
          updateCartItemQuantity={updateCartItemQuantity}
          removeCartItem={removeCartItem}
          clearCart={clearCart}
          calculateTotal={calculateTotal}
          disabled={isViewer}
        />
        
        <PaymentSection 
          cartItems={cartItems}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cashReceived={cashReceived}
          handleCashReceivedChange={handleCashReceivedChange}
          calculateTotal={calculateTotal}
          calculateChange={calculateChange}
          handleConfirmSale={handleConfirmSale}
          loading={loading}
          isViewer={isViewer}
        />
      </div>
    </div>
  );
}
