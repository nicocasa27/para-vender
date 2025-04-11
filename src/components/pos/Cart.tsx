
import { CartItem } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartProps {
  cartItems: CartItem[];
  updateCartItemQuantity: (itemId: string, newQuantity: number) => void;
  removeCartItem: (itemId: string) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  disabled?: boolean;
}

export function Cart({
  cartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  calculateTotal,
  disabled = false
}: CartProps) {
  if (cartItems.length === 0) {
    return (
      <div className="text-center p-6 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">El carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cartItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nombre}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCartItemQuantity(item.id, Math.max(1, item.cantidad - 1))}
                    disabled={disabled}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1) {
                        updateCartItemQuantity(item.id, value);
                      }
                    }}
                    className="h-8 w-16 mx-2 text-center"
                    disabled={disabled}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCartItemQuantity(item.id, item.cantidad + 1)}
                    disabled={disabled}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">${item.precio.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">
                ${(item.precio * item.cantidad).toFixed(2)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCartItem(item.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-bold">
              Total:
            </TableCell>
            <TableCell className="text-right font-bold text-lg">
              ${calculateTotal().toFixed(2)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-500 hover:text-red-700"
                disabled={disabled}
              >
                Vaciar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
