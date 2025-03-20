
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

import { transferFormSchema, TransferFormValues } from "./transfer-form-schema";
import { fetchStores, fetchProductsInStore, transferInventory } from "./inventory-transfer-service";
import { Store, Product } from "./types";

interface TransferFormProps {
  onTransferSuccess: () => void;
}

export function TransferForm({ onTransferSuccess }: TransferFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSourceStore, setSelectedSourceStore] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      sourceStore: "",
      targetStore: "",
      product: "",
      quantity: 1,
      notes: "",
    },
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedSourceStore) {
      loadProductsForStore(selectedSourceStore);
    } else {
      setProducts([]);
    }
  }, [selectedSourceStore]);

  const loadStores = async () => {
    try {
      const storesData = await fetchStores();
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
      const productsData = await fetchProductsInStore(storeId);
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

  const handleTransfer = async (data: TransferFormValues) => {
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
      await transferInventory(
        data.product,
        data.sourceStore,
        data.targetStore,
        data.quantity,
        data.notes
      );

      toast({
        title: "Transferencia exitosa",
        description: `Se han transferido ${data.quantity} unidades correctamente.`,
      });
      
      form.reset();
      setSelectedSourceStore(null);
      setSelectedProduct(null);
      onTransferSuccess();
    } catch (error) {
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
          name="sourceStore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sucursal de Origen</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedSourceStore(value);
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
          name="targetStore"
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
                      disabled={store.id === selectedSourceStore}
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
          name="product"
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
                disabled={!selectedSourceStore || isLoading}
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
                      {selectedSourceStore 
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
