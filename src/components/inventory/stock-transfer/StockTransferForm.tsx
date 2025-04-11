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
import { supabase } from "@/integrations/supabase/client";
import { ProductStock, StockTransferFormProps, StoreData } from "./types";
import { toast } from "sonner";

const transferSchema = z.object({
  sourceStoreId: z.string().min(1, { message: "Selecciona un almacén de origen" }),
  targetStoreId: z.string().min(1, { message: "Selecciona un almacén de destino" }),
  productId: z.string().min(1, { message: "Selecciona un producto" }),
  quantity: z.coerce.number().min(1, { message: "La cantidad debe ser mayor a 0" }),
  notes: z.string().optional(),
}).refine(data => data.sourceStoreId !== data.targetStoreId, {
  message: "El origen y destino no pueden ser el mismo",
  path: ["targetStoreId"],
});

export function StockTransferForm({ onTransferComplete }: StockTransferFormProps) {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
  const sourceStoreId = watch("sourceStoreId");

  // Load stores on component mount
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
        console.error("Error al cargar sucursales:", error);
        toast.error("Error al cargar las sucursales");
      }
    };

    loadStores();
  }, []);

  // Load products when source store changes
  useEffect(() => {
    const loadProducts = async () => {
      if (!sourceStoreId) {
        setProducts([]);
        return;
      }

      try {
        // First get inventory items for the store
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventario")
          .select(`
            id,
            cantidad,
            producto_id,
            almacen_id
          `)
          .eq("almacen_id", sourceStoreId)
          .gt("cantidad", 0);

        if (inventoryError) throw inventoryError;

        if (!inventoryData || inventoryData.length === 0) {
          setProducts([]);
          return;
        }

        // Extract product IDs
        const productIds = inventoryData.map(item => item.producto_id);

        // Get product details separately
        const { data: productsData, error: productsError } = await supabase
          .from("productos")
          .select(`
            id,
            nombre,
            unidad_id
          `)
          .in("id", productIds);

        if (productsError) throw productsError;

        // Get units separately
        const { data: unitsData, error: unitsError } = await supabase
          .from("unidades")
          .select("id, abreviatura, nombre");

        if (unitsError) {
          console.error("Error fetching units:", unitsError);
          // Continue without units information
        }

        // Create a map for units
        const unitsMap = new Map();
        if (unitsData) {
          unitsData.forEach(unit => {
            unitsMap.set(unit.id, unit);
          });
        }

        // Create a map for inventory quantities
        const inventoryMap = new Map();
        inventoryData.forEach(item => {
          inventoryMap.set(item.producto_id, Number(item.cantidad));
        });

        // Transform the data to match our ProductStock interface
        const productsStock = (productsData || []).map(product => {
          const unit = product.unidad_id ? unitsMap.get(product.unidad_id) : null;
          return {
            id: product.id,
            nombre: product.nombre,
            unidad: unit ? unit.abreviatura || unit.nombre : "u",
            stock: inventoryMap.get(product.id) || 0,
          };
        });

        setProducts(productsStock);
        setValue("productId", ""); // Reset product selection when store changes
      } catch (error: any) {
        console.error("Error al cargar productos:", error);
        toast.error("Error al cargar los productos", {
          description: error.message || "Hubo un problema cargando productos"
        });
        setProducts([]);
      }
    };

    loadProducts();
  }, [sourceStoreId, setValue]);

  const onSubmit = async (data: z.infer<typeof transferSchema>) => {
    setIsLoading(true);
    
    try {
      // 1. Get current quantity of the product in source store
      const { data: sourceInventory, error: sourceError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", data.productId)
        .eq("almacen_id", data.sourceStoreId)
        .single();
      
      if (sourceError) throw sourceError;
      
      // 2. Check if there's enough stock
      if (Number(sourceInventory.cantidad) < data.quantity) {
        toast.error("Stock insuficiente en el almacén de origen");
        return;
      }
      
      // 3. Update source inventory (decrement)
      const newSourceQuantity = Number(sourceInventory.cantidad) - data.quantity;
      const { error: updateSourceError } = await supabase
        .from("inventario")
        .update({ cantidad: newSourceQuantity })
        .eq("id", sourceInventory.id);
      
      if (updateSourceError) throw updateSourceError;
      
      // 4. Check if product exists in target store
      const { data: targetInventory, error: targetCheckError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", data.productId)
        .eq("almacen_id", data.targetStoreId)
        .maybeSingle();
      
      if (targetCheckError) throw targetCheckError;
      
      // 5. Update target inventory or create new record
      if (targetInventory) {
        // Update existing inventory
        const newTargetQuantity = Number(targetInventory.cantidad) + data.quantity;
        const { error: updateTargetError } = await supabase
          .from("inventario")
          .update({ cantidad: newTargetQuantity })
          .eq("id", targetInventory.id);
        
        if (updateTargetError) throw updateTargetError;
      } else {
        // Create new inventory record
        const { error: insertTargetError } = await supabase
          .from("inventario")
          .insert({
            producto_id: data.productId,
            almacen_id: data.targetStoreId,
            cantidad: data.quantity
          });
        
        if (insertTargetError) throw insertTargetError;
      }
      
      // 6. Record the transfer in the movements table
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
      
      // Success
      toast.success("Transferencia completada con éxito");
      form.reset();
      onTransferComplete();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sourceStoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén de Origen</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un almacén" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id} disabled={store.id === sourceStoreId}>
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
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!sourceStoreId || products.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem disabled value="no-products">
                      {sourceStoreId 
                        ? "No hay productos con stock en esta sucursal" 
                        : "Selecciona primero una sucursal de origen"}
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nombre} ({product.stock} {product.unidad})
                      </SelectItem>
                    ))
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
              <FormLabel>Cantidad a Transferir</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  {...field} 
                  disabled={!sourceStoreId || !form.getValues("productId")}
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
                  placeholder="Notas adicionales sobre la transferencia" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !sourceStoreId} 
          className="w-full"
        >
          {isLoading ? "Procesando..." : "Realizar Transferencia"}
        </Button>
      </form>
    </Form>
  );
}
