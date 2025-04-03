
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { ArrowRight, Loader } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const transferSchema = z.object({
  productId: z.string({ required_error: "Debe seleccionar un producto" }),
  sourceStore: z.string({ required_error: "Debe seleccionar almacén origen" }),
  destinationStore: z.string({ required_error: "Debe seleccionar almacén destino" }),
  quantity: z.coerce
    .number()
    .positive({ message: "La cantidad debe ser un número positivo" })
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface StockTransferFormProps {
  onTransferSuccess?: () => void;
}

export function StockTransferForm({ onTransferSuccess }: StockTransferFormProps) {
  const [stores, setStores] = useState<{ id: string; nombre: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const { products, isLoading: productsLoading } = useProducts("all");

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      productId: "",
      sourceStore: "",
      destinationStore: "",
      quantity: 1,
    },
  });

  const { watch } = form;
  const selectedProductId = watch("productId");
  const selectedSourceStore = watch("sourceStore");
  
  useEffect(() => {
    const loadStores = async () => {
      try {
        const { data, error } = await supabase
          .from("almacenes")
          .select("id, nombre")
          .order("nombre");

        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error("Error loading stores:", error);
        toast.error("Error al cargar almacenes");
      }
    };

    loadStores();
  }, []);

  // Update available stock when product or source store changes
  useEffect(() => {
    if (selectedProductId && selectedSourceStore) {
      const calculateAvailableStock = async () => {
        const { data, error } = await supabase
          .from("inventario")
          .select("cantidad")
          .eq("producto_id", selectedProductId)
          .eq("almacen_id", selectedSourceStore)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching stock:", error);
          setAvailableStock(0);
          return;
        }
        
        setAvailableStock(data ? Number(data.cantidad) : 0);
      };
      
      calculateAvailableStock();
    } else {
      setAvailableStock(null);
    }
  }, [selectedProductId, selectedSourceStore]);

  const onSubmit = async (data: TransferFormValues) => {
    // Validate that source and destination are different
    if (data.sourceStore === data.destinationStore) {
      toast.error("Los almacenes de origen y destino deben ser diferentes");
      return;
    }

    // Validate stock availability
    if (availableStock !== null && data.quantity > availableStock) {
      toast.error(`Stock insuficiente. Solo hay ${availableStock} unidades disponibles.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Execute the stock transfer using the API functions
      await executeTransfer(data.productId, data.sourceStore, data.destinationStore, data.quantity);
      
      toast.success("Transferencia completada", {
        description: `Se transfirieron ${data.quantity} unidades correctamente`
      });
      
      form.reset();
      setAvailableStock(null);
      
      if (onTransferSuccess) {
        onTransferSuccess();
      }
      
    } catch (error) {
      console.error("Error transferring stock:", error);
      toast.error("Error al transferir stock", {
        description: "No se pudo completar la transferencia"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to execute the transfer operations
  const executeTransfer = async (
    productId: string,
    sourceStore: string,
    destinationStore: string,
    quantity: number
  ) => {
    // 1. Get current quantity in source store
    const { data: sourceData, error: sourceError } = await supabase
      .from("inventario")
      .select("cantidad")
      .eq("producto_id", productId)
      .eq("almacen_id", sourceStore)
      .single();
      
    if (sourceError) throw sourceError;
    const sourceQuantity = Number(sourceData.cantidad);
    
    if (quantity > sourceQuantity) {
      throw new Error("Stock insuficiente");
    }
    
    // 2. Update source inventory (decrement)
    const { error: sourceUpdateError } = await supabase
      .from("inventario")
      .update({ 
        cantidad: sourceQuantity - quantity,
        updated_at: new Date().toISOString() 
      })
      .eq("producto_id", productId)
      .eq("almacen_id", sourceStore);
    
    if (sourceUpdateError) throw sourceUpdateError;
    
    // 3. Check if product exists in target store
    const { data: destData, error: destError } = await supabase
      .from("inventario")
      .select("cantidad")
      .eq("producto_id", productId)
      .eq("almacen_id", destinationStore)
      .maybeSingle();
    
    if (destError) throw destError;
    
    if (destData) {
      // 4a. Update existing target inventory (increment)
      const destQuantity = Number(destData.cantidad);
      
      const { error: destUpdateError } = await supabase
        .from("inventario")
        .update({ 
          cantidad: destQuantity + quantity,
          updated_at: new Date().toISOString() 
        })
        .eq("producto_id", productId)
        .eq("almacen_id", destinationStore);
      
      if (destUpdateError) throw destUpdateError;
    } else {
      // 4b. Create new inventory record
      const { error: newInvError } = await supabase
        .from("inventario")
        .insert({
          producto_id: productId,
          almacen_id: destinationStore,
          cantidad: quantity
        });
      
      if (newInvError) throw newInvError;
    }
    
    // 5. Record the movement
    const { error: moveError } = await supabase
      .from("movimientos")
      .insert({
        tipo: "transferencia",
        producto_id: productId,
        almacen_origen_id: sourceStore,
        almacen_destino_id: destinationStore,
        cantidad: quantity
      });
    
    if (moveError) throw moveError;
  };

  // Helper function to get store name by ID
  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.nombre || "";
  };

  const getProductTotalStock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    return Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productsLoading ? (
                    <div className="flex justify-center p-2">
                      <Loader className="animate-spin h-4 w-4" />
                    </div>
                  ) : (
                    products
                      .filter(product => {
                        // Filtrar productos que tienen stock en alguna sucursal
                        const totalStock = Object.values(product.stock).reduce((sum, val) => sum + val, 0);
                        return totalStock > 0;
                      })
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.nombre} (Stock: {getProductTotalStock(product.id)})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sourceStore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Almacén Origen</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar origen" />
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

          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <FormField
            control={form.control}
            name="destinationStore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Almacén Destino</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem 
                        key={store.id} 
                        value={store.id}
                        disabled={store.id === form.getValues("sourceStore")}
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
        </div>

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad a transferir</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    min={1}
                    max={availableStock || undefined}
                  />
                  {availableStock !== null && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      Disponible: {availableStock}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedSourceStore && selectedProductId && (
          <div className="mt-2 text-sm">
            <p className="text-muted-foreground">
              {availableStock !== null
                ? `Transferir desde ${getStoreName(selectedSourceStore)} (${availableStock} disponibles)`
                : "Seleccione un producto y almacén origen para ver disponibilidad"}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Transferir Stock
          </Button>
        </div>
      </form>
    </Form>
  );
};
