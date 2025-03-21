
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { StoreData, ProductStock } from "./types";
import { stockTransferSchema, StockTransferFormValues } from "./validation-schema";
import { getStores, getProductsInStore, executeStockTransfer } from "./stock-transfer-api";

interface StockTransferFormProps {
  onTransferSuccess: () => void;
}

export function StockTransferForm({ onTransferSuccess }: StockTransferFormProps) {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [sourceStore, setSourceStore] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StockTransferFormValues>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      sourceStoreId: "",
      targetStoreId: "",
      productId: "",
      quantity: 1,
      notes: "",
    },
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (sourceStore) {
      loadProductsForStore(sourceStore);
    } else {
      setProducts([]);
    }
  }, [sourceStore]);

  const loadStores = async () => {
    try {
      const storesData = await getStores();
      setStores(storesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales.",
        variant: "destructive",
      });
    }
  };

  const loadProductsForStore = async (storeId: string) => {
    setIsLoading(true);
    try {
      const productsData = await getProductsInStore(storeId);
      setProducts(productsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async (data: StockTransferFormValues) => {
    if (!selectedProduct) return;
    
    if (data.quantity > selectedProduct.stock) {
      toast({
        title: "Error",
        description: `No hay suficiente stock. Disponible: ${selectedProduct.stock} ${selectedProduct.unidad}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await executeStockTransfer(
        data.productId,
        data.sourceStoreId,
        data.targetStoreId,
        data.quantity,
        data.notes
      );

      toast({
        title: "Transferencia exitosa",
        description: `Se han transferido ${data.quantity} unidades correctamente.`,
      });
      
      form.reset();
      setSourceStore(null);
      setSelectedProduct(null);
      onTransferSuccess();
    } catch (error) {
      console.error("Transfer error:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la transferencia. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleTransfer)} className="space-y-6">
        <FormField
          control={form.control}
          name="sourceStoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sucursal de Origen</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSourceStore(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una sucursal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <ArrowRight className="text-muted-foreground" />
        </div>

        <FormField
          control={form.control}
          name="targetStoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sucursal de Destino</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una sucursal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem 
                      key={store.id} 
                      value={store.id}
                      disabled={store.id === sourceStore}
                    >
                      {store.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  const product = products.find(p => p.id === value) || null;
                  setSelectedProduct(product);
                }}
                value={field.value}
                disabled={!sourceStore || isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Cargando productos...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Seleccione un producto" />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      {sourceStore 
                        ? "No hay productos con stock en esta sucursal" 
                        : "Seleccione una sucursal primero"}
                    </div>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex justify-between w-full">
                          <span>{product.nombre}</span>
                          <span className="text-muted-foreground">
                            {product.stock} {product.unidad}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <div className="text-sm text-muted-foreground mt-1">
                  Stock disponible: {selectedProduct.stock} {selectedProduct.unidad}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  {...field}
                  disabled={!selectedProduct}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ingrese notas adicionales sobre esta transferencia"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando
            </>
          ) : (
            "Realizar Transferencia"
          )}
        </Button>
      </form>
    </Form>
  );
}
