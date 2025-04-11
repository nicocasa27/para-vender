
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Minus, Plus } from "lucide-react";
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

  const incrementQuantity = (itemId: string, currentQuantity: number) => {
    updateCartItemQuantity(itemId, currentQuantity + 1);
  };

  const decrementQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateCartItemQuantity(itemId, currentQuantity - 1);
    }
  };

  return (
    <div className="space-y-4">
      {cartItems.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg text-muted-foreground">
          <p className="text-lg">El carrito está vacío</p>
          <p className="text-sm mt-2">Seleccione productos para agregar al carrito</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Producto</TableHead>
                  <TableHead className="w-[15%]">Precio</TableHead>
                  <TableHead className="w-[20%]">Cantidad</TableHead>
                  <TableHead className="w-[15%]">Subtotal</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>${item.precio.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => decrementQuantity(item.id, item.cantidad)}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="text"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-12 text-center h-8 p-0"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => incrementQuantity(item.id, item.cantidad)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${(item.precio * item.cantidad).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeCartItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-4">
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
