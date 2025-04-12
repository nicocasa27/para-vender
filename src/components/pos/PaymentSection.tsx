
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CartItem } from "@/types/cart";
import { CreditCard, Banknote } from "lucide-react";

interface PaymentSectionProps {
  cartItems: CartItem[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  cashReceived: string;
  handleCashReceivedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  calculateTotal: () => number;
  calculateChange: () => string;
  handleConfirmSale: () => void;
  loading: boolean;
  isViewer: boolean;
}

export function PaymentSection({
  cartItems,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  handleCashReceivedChange,
  calculateTotal,
  calculateChange,
  handleConfirmSale,
  loading,
  isViewer
}: PaymentSectionProps) {
  if (cartItems.length === 0) return null;

  const isCashPaymentValid = paymentMethod === "efectivo" &&
    (parseFloat(cashReceived) < calculateTotal() || isNaN(parseFloat(cashReceived)));

  return (
    <div className="mt-6 p-4 border rounded-lg space-y-4">
      <div>
        <h3 className="font-medium mb-2">Método de Pago</h3>
        <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isViewer}>
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
                disabled={isViewer}
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
        disabled={isViewer || loading || isCashPaymentValid}
      >
        {loading ? "Procesando..." : isViewer ? "Modo Vista Previa" : "Confirmar Venta"}
      </Button>
    </div>
  );
}
