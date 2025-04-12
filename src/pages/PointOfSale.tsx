
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStores } from "@/hooks/useStores";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { useAuth } from "@/contexts/auth";
import { ShoppingCart } from "lucide-react";
import { ViewerWarning } from "@/components/pos/ViewerWarning";
import { PointOfSaleContent } from "@/components/pos/PointOfSaleContent";
import { usePosState } from "@/hooks/usePosState";

export default function PointOfSale() {
  const {
    selectedStore,
    setSelectedStore,
    cartItems,
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
  } = usePosState();

  const { stores } = useStores();
  const { stores: userStores } = useCurrentStores();
  const { hasRole } = useAuth();

  // Set available stores based on user role
  // Admin y manager pueden ver todas las sucursales, los demás solo las asignadas
  const availableStores = hasRole("admin") || hasRole("manager") 
    ? stores 
    : userStores;

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
          <ViewerWarning isViewer={isViewer} />
          
          <div className="mb-4">
            <Select onValueChange={(value) => setSelectedStore(value)} value={selectedStore || ""}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Seleccionar Sucursal" />
              </SelectTrigger>
              <SelectContent>
                {availableStores.map((store) => (
                  <SelectItem key={store.id} value={store.id || "store-sin-id"}>
                    {store.nombre || "Sin nombre"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStore ? (
            <PointOfSaleContent
              selectedStore={selectedStore}
              cartItems={cartItems}
              updateCartItemQuantity={updateCartItemQuantity}
              removeCartItem={removeCartItem}
              clearCart={clearCart}
              calculateTotal={calculateTotal}
              handleProductSelect={handleProductSelect}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cashReceived={cashReceived}
              handleCashReceivedChange={handleCashReceivedChange}
              calculateChange={calculateChange}
              handleConfirmSale={handleConfirmSale}
              loading={loading}
              isViewer={isViewer}
            />
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
