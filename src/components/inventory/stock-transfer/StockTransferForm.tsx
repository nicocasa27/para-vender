import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StoreData, ProductStock } from "./types";
import { getStores, getProductsInStore, executeStockTransfer } from "./stock-transfer-api";
import { toast } from "sonner";

const transferSchema = z.object({
  sourceStoreId: z.string().min(1, { message: "Selecciona un almacén de origen" }),
  targetStoreId: z.string().min(1, { message: "Selecciona un almacén de destino" }),
  productId: z.string().min(1, { message: "Selecciona un producto" }),
  quantity: z.coerce.number().min(1, { message: "La cantidad debe ser mayor a 0" }),
  notes: z.string().optional(),
});

interface StockTransferFormProps {
  onTransferComplete: () => void;
}

export function StockTransferForm({ onTransferComplete }: StockTransferFormProps) {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [sourceData, setSourceData] = useState<{ cantidad: number } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceStoreId: "",
      targetStoreId: "",
      productId: "",
      quantity: 1,
      notes: "",
    },
  });

  const { watch, setValue } = form;
  const { sourceStoreId, productId } = watch();

  useEffect(() => {
    const loadStores = async () => {
      const storesData = await getStores();
      setStores(storesData);
    };
    loadStores();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (sourceStoreId) {
        const productsData = await getProductsInStore(sourceStoreId);
        setProducts(productsData);
        setValue("productId", "");
      } else {
        setProducts([]);
        setValue("productId", "");
      }
    };
    loadProducts();
  }, [sourceStoreId, setValue]);

  useEffect(() => {
    const loadSourceData = async () => {
      if (sourceStoreId && productId) {
        // Fetch the source inventory data
        try {
          const { data, error } = await supabase
            .from("inventario")
            .select("cantidad")
            .eq("producto_id", productId)
            .eq("almacen_id", sourceStoreId)
            .single();
          
          if (error) {
            console.error("Error fetching source data:", error);
            toast.error("Error al cargar datos del inventario de origen");
            setSourceData(null);
          } else {
            setSourceData(data ? { cantidad: data.cantidad } : null);
          }
        } catch (error) {
          console.error("Error fetching source data:", error);
          toast.error("Error al cargar datos del inventario de origen");
          setSourceData(null);
        }
      } else {
        setSourceData(null);
      }
    };
    loadSourceData();
  }, [sourceStoreId, productId]);

  const handleUpdateInventory = async () => {
    if (!sourceStoreId || !productId) return;

    if (!sourceData) {
      toast.error("No se pudieron cargar los datos del inventario de origen");
      return;
    }

    const quantity = form.getValues("quantity");
    if (sourceData) {
      const newSourceAmount = Math.max(0, sourceData.cantidad - Number(quantity));

      try {
        const { error } = await supabase
          .from("inventario")
          .update({ cantidad: newSourceAmount, updated_at: new Date().toISOString() })
          .eq("producto_id", productId)
          .eq("almacen_id", sourceStoreId);

        if (error) {
          console.error("Error updating inventory:", error);
          toast.error("Error al actualizar el inventario");
        } else {
          toast.success("Inventario actualizado correctamente");
        }
      } catch (error) {
        console.error("Error updating inventory:", error);
        toast.error("Error al actualizar el inventario");
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof transferSchema>) => {
    setIsTransferring(true);
    try {
      await executeStockTransfer(
        data.productId,
        data.sourceStoreId,
        data.targetStoreId,
        data.quantity,
        data.notes
      );
      form.reset();
      onTransferComplete();
    } catch (error) {
      console.error("Error al procesar la transferencia:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sourceStoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén de Origen</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un almacén" />
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
        <FormField
          control={form.control}
          name="targetStoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén de Destino</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un almacén" />
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
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nombre} ({product.unidad}) - Stock: {product.stock}
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
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad a Transferir</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Cantidad" {...field} />
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
                <Textarea placeholder="Notas adicionales" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isTransferring}>
          {isTransferring ? "Transfiriendo..." : "Transferir"}
        </Button>
      </form>
    </Form>
  );
}
