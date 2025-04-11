
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Truck, ArrowRightLeft } from "lucide-react";
import { StoreSelector } from "./StoreSelector";
import { supabase } from "@/integrations/supabase/client";
import { TransferHistory } from "./stock-transfer/TransferHistory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema for the form validation
const transferSchema = z.object({
  sourceStoreId: z.string().min(1, { message: "Origen es requerido" }),
  targetStoreId: z.string().min(1, { message: "Destino es requerido" }),
  productId: z.string().min(1, { message: "Producto es requerido" }),
  quantity: z.coerce.number().positive({ message: "La cantidad debe ser mayor a 0" }),
  notes: z.string().optional(),
}).refine(data => data.sourceStoreId !== data.targetStoreId, {
  message: "El origen y destino no pueden ser el mismo",
  path: ["targetStoreId"],
});

export function StockTransfer() {
  const [sourceStore, setSourceStore] = useState<string | null>(null);
  const [targetStore, setTargetStore] = useState<string | null>(null);
  const [products, setProducts] = useState<Array<{ id: string; nombre: string; stock: number; unidad: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Reset the form and refresh the history when a transfer is completed
  const handleTransferComplete = () => {
    form.reset();
    setSourceStore(null);
    setTargetStore(null);
    setProducts([]);
    setRefreshKey(prev => prev + 1);
    toast.success("Transferencia completada con éxito");
  };

  // Load products when source store changes
  useEffect(() => {
    if (!sourceStore) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("inventario")
          .select(`
            cantidad,
            productos!inner(
              id,
              nombre,
              unidades(nombre, abreviatura)
            )
          `)
          .eq("almacen_id", sourceStore)
          .gt("cantidad", 0);

        if (error) throw error;

        // Transform the data to match our product format
        const productsData = (data || []).map((item: any) => ({
          id: item.productos.id,
          nombre: item.productos.nombre,
          stock: Number(item.cantidad),
          unidad: item.productos.unidades?.abreviatura || "u",
        }));

        setProducts(productsData);
        form.setValue("productId", "");
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("Error al cargar los productos");
      }
    };

    fetchProducts();
  }, [sourceStore, form]);

  // Update form values when stores change
  useEffect(() => {
    if (sourceStore) {
      form.setValue("sourceStoreId", sourceStore);
    } else {
      form.setValue("sourceStoreId", "");
    }
    
    if (targetStore) {
      form.setValue("targetStoreId", targetStore);
    } else {
      form.setValue("targetStoreId", "");
    }
  }, [sourceStore, targetStore, form]);

  const onSubmit = async (data: z.infer<typeof transferSchema>) => {
    setIsLoading(true);
    
    try {
      // Get the current quantity of the product in the source store
      const { data: sourceInventory, error: sourceError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", data.productId)
        .eq("almacen_id", data.sourceStoreId)
        .single();
      
      if (sourceError) throw sourceError;
      
      // Check if there's enough stock
      if (Number(sourceInventory.cantidad) < data.quantity) {
        toast.error("Stock insuficiente en el almacén de origen");
        return;
      }
      
      // Update source inventory (reduce)
      const newSourceQuantity = Number(sourceInventory.cantidad) - data.quantity;
      const { error: updateSourceError } = await supabase
        .from("inventario")
        .update({ cantidad: newSourceQuantity })
        .eq("id", sourceInventory.id);
      
      if (updateSourceError) throw updateSourceError;
      
      // Check if product exists in target store
      const { data: targetInventory, error: targetCheckError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", data.productId)
        .eq("almacen_id", data.targetStoreId)
        .maybeSingle();
      
      if (targetCheckError) throw targetCheckError;
      
      if (targetInventory) {
        // Update target inventory (increment)
        const newTargetQuantity = Number(targetInventory.cantidad) + data.quantity;
        const { error: updateTargetError } = await supabase
          .from("inventario")
          .update({ cantidad: newTargetQuantity })
          .eq("id", targetInventory.id);
        
        if (updateTargetError) throw updateTargetError;
      } else {
        // Create new inventory record in target store
        const { error: insertTargetError } = await supabase
          .from("inventario")
          .insert({
            producto_id: data.productId,
            almacen_id: data.targetStoreId,
            cantidad: data.quantity
          });
        
        if (insertTargetError) throw insertTargetError;
      }
      
      // Record the transfer in the movements table
      const { error: movementError } = await supabase
        .from("movimientos")
        .insert({
          tipo: "transferencia",
          producto_id: data.productId,
          almacen_origen_id: data.sourceStoreId,
          almacen_destino_id: data.targetStoreId,
          cantidad: data.quantity,
          notas: data.notes || null
        });
      
      if (movementError) throw movementError;
      
      handleTransferComplete();
    } catch (error: any) {
      console.error("Error en la transferencia:", error);
      toast.error("Error al realizar la transferencia", {
        description: error.message || "Ha ocurrido un error inesperado"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 my-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transferencia de Stock</h2>
          <p className="text-muted-foreground">
            Transfiere productos entre sucursales de manera sencilla
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Nueva Transferencia
            </CardTitle>
            <CardDescription>Mueva productos entre sucursales</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Sucursal de Origen</FormLabel>
                    <StoreSelector
                      selectedStore={sourceStore}
                      onStoreChange={setSourceStore}
                      label="Seleccionar origen"
                      excludeStoreId={targetStore}
                    />
                    {form.formState.errors.sourceStoreId && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {form.formState.errors.sourceStoreId.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <FormLabel>Sucursal de Destino</FormLabel>
                    <StoreSelector
                      selectedStore={targetStore}
                      onStoreChange={setTargetStore}
                      label="Seleccionar destino"
                      excludeStoreId={sourceStore}
                    />
                    {form.formState.errors.targetStoreId && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {form.formState.errors.targetStoreId.message}
                      </p>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto</FormLabel>
                      <Select
                        disabled={!sourceStore || products.length === 0}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.length > 0 ? (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.nombre} - Stock: {product.stock} {product.unidad}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="no-products">
                              {sourceStore 
                                ? "No hay productos con stock en esta sucursal" 
                                : "Selecciona primero una sucursal de origen"}
                            </SelectItem>
                          )}
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
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
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
                        <Textarea placeholder="Notas adicionales sobre la transferencia" {...field} />
                      </FormControl>
                      <FormDescription>
                        Puedes agregar detalles o razones para esta transferencia
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isLoading || !sourceStore || !targetStore} 
                  className="w-full"
                >
                  {isLoading ? "Procesando..." : "Realizar Transferencia"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Historial de Transferencias
            </CardTitle>
            <CardDescription>Últimas transferencias realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <TransferHistory key={refreshKey} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
