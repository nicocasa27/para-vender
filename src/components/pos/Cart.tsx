
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { CartItem } from "@/types/cart";

export interface CartProps {
  cartItems: CartItem[];
  updateCartItemQuantity: (itemId: string, newQuantity: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  calculateTotal: () => number;
}

export function Cart({
  cartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  calculateTotal
}: CartProps) {
  const handleQuantityChange = (itemId: string, newValue: string) => {
    const newQuantity = parseInt(newValue);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateCartItemQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className="space-y-4">
      {cartItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          El carrito está vacío
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>${item.precio.toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>${(item.precio * item.cantidad).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeCartItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearCart}>
              Vaciar Carrito
            </Button>
            <div className="text-xl font-bold">
              Total: ${calculateTotal().toFixed(2)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
