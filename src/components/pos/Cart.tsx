
import { useState } from "react";
import { Plus, Minus, Trash2, Check, X, ShoppingCart, Receipt, CreditCard, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.07; // 7% tax
  const total = subtotal + tax;
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;

  const handleCompleteSale = () => {
    if (paymentMethod === "cash" && (parseFloat(cashReceived) < total || !cashReceived)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cash received must be greater than or equal to the total amount.",
      });
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentComplete(true);
      
      // Simulate receipt printing delay
      setTimeout(() => {
        setIsPaymentDialogOpen(false);
        setIsPaymentComplete(false);
        setPaymentMethod("cash");
        setCashReceived("");
        onClearCart();
        
        toast({
          title: "Sale Complete",
          description: "The sale has been processed successfully.",
        });
      }, 1500);
    }, 2000);
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-base font-medium flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Current Sale
          </CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-hidden">
          {items.length > 0 ? (
            <ScrollArea className="h-full">
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 animate-fade-in">
                      <div className="flex justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground text-sm">
                            ${item.price.toFixed(2)} per unit
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0 && val <= item.stock) {
                                onUpdateQuantity(item.id, val);
                              }
                            }}
                            className="h-8 w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </ScrollArea>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-4">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-center mb-1">Your cart is empty</p>
              <p className="text-center text-sm">Add products to begin a new sale</p>
            </div>
          )}
        </div>
        <CardFooter className="flex-col p-4 border-t gap-4">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (7%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClearCart}
              disabled={items.length === 0}
            >
              Clear
            </Button>
            <Button
              className="w-full"
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={items.length === 0}
            >
              Pay
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isPaymentComplete ? "Payment Complete" : "Complete Sale"}</DialogTitle>
            <DialogDescription>
              {isPaymentComplete 
                ? "The payment has been processed successfully." 
                : "Select a payment method and complete the transaction."}
            </DialogDescription>
          </DialogHeader>
          
          {isPaymentComplete ? (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Transaction Complete</h3>
              <p className="text-center text-muted-foreground">
                The sale has been processed and the receipt is being printed.
              </p>
              <div className="text-center">
                <div className="text-sm">Total Amount</div>
                <div className="text-2xl font-bold">${total.toFixed(2)}</div>
              </div>
              <div className="animate-pulse flex items-center text-muted-foreground text-sm">
                <Printer className="h-4 w-4 mr-2" />
                Printing receipt...
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Payment Method</h3>
                  <Tabs 
                    defaultValue="cash" 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="cash">Cash</TabsTrigger>
                      <TabsTrigger value="card">Card</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {paymentMethod === "cash" ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm font-medium">Cash Received</div>
                        <div className="text-sm text-muted-foreground">
                          Total: ${total.toFixed(2)}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={total}
                        step="0.01"
                        placeholder="Enter amount"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                      />
                    </div>
                    
                    {cashReceived && parseFloat(cashReceived) >= total && (
                      <div className="p-3 bg-muted rounded-md animate-fade-in">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Change Due</span>
                          <span>${change.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Select defaultValue="credit">
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="debit">Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="p-3 border rounded-md border-dashed flex justify-center items-center h-20">
                      <div className="text-center text-muted-foreground">
                        <CreditCard className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm">Card terminal will be used</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-md border p-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (7%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCompleteSale} disabled={isProcessing}>
                  {isProcessing && (
                    <div className="loader mr-2" />
                  )}
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
