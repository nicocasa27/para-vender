
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash, Plus, Minus, Receipt, CreditCard, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [customerName, setCustomerName] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * 0.16; // IVA 16%
  const total = subtotal + taxes;
  const currentDate = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  const handleCompleteSale = () => {
    // Aquí iría la lógica para procesar la venta
    toast({
      title: "Venta completada",
      description: `Venta por $${total.toFixed(2)} procesada con éxito`,
    });
    onClearCart();
    setPaymentDialogOpen(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Carrito de Compra</CardTitle>
        <p className="text-sm text-muted-foreground">{currentDate}</p>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-auto">
        {items.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
            <Receipt className="mb-3 h-10 w-10" />
            <p>El carrito está vacío</p>
            <p className="text-xs">Añada productos para iniciar una venta</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none rounded-l-md"
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none rounded-r-md"
                      onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col border-t pt-4">
        <div className="w-full space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (16%)</span>
            <span>${taxes.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={items.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Vaciar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Vaciar carrito?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente todos los
                  productos del carrito.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClearCart}>Continuar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" disabled={items.length === 0}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Completar venta</DialogTitle>
                <DialogDescription>
                  Ingrese la información para finalizar la venta.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="customer" className="col-span-1 text-right text-sm">
                    Cliente
                  </label>
                  <Input
                    id="customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente (opcional)"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="paymentMethod" className="col-span-1 text-right text-sm">
                    Método de pago
                  </label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="col-span-3" id="paymentMethod">
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de crédito/débito</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mt-2 rounded-md bg-muted p-4">
                  <div className="text-sm">
                    <div className="flex justify-between py-1">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>IVA (16%)</span>
                      <span>${taxes.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between py-1 font-medium">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleCompleteSale}>
                  Completar venta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};
