
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Store {
  id: string;
  nombre: string;
}

interface Product {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
}

interface TransferHistory {
  id: string;
  fecha: string;
  origen: string;
  destino: string;
  producto: string;
  cantidad: number;
  notas: string | null;
}

const transferFormSchema = z.object({
  sourceStore: z.string({
    required_error: "Seleccione la sucursal de origen",
  }),
  targetStore: z.string({
    required_error: "Seleccione la sucursal de destino",
  }),
  product: z.string({
    required_error: "Seleccione el producto a transferir",
  }),
  quantity: z.coerce.number()
    .positive({
      message: "La cantidad debe ser un número positivo",
    }),
  notes: z.string().optional(),
}).refine(data => data.sourceStore !== data.targetStore, {
  message: "Las sucursales de origen y destino deben ser diferentes",
  path: ["targetStore"],
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

export function InventoryTransfer() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSourceStore, setSelectedSourceStore] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
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
    fetchStores();
    fetchTransferHistory();
  }, []);

  useEffect(() => {
    if (selectedSourceStore) {
      fetchProductsInStore(selectedSourceStore);
    } else {
      setProducts([]);
    }
  }, [selectedSourceStore]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("almacenes")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales.",
        variant: "destructive",
      });
    }
  };

  const fetchProductsInStore = async (storeId: string) => {
    setIsLoading(true);
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
        .eq("almacen_id", storeId)
        .gt("cantidad", 0);

      if (error) throw error;

      if (data) {
        const formattedProducts = data.map(item => ({
          id: item.productos.id,
          nombre: item.productos.nombre,
          unidad: item.productos.unidades?.abreviatura || "u",
          stock: Number(item.cantidad),
        }));
        
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTransferHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("movimientos")
        .select(`
          id,
          created_at,
          tipo,
          cantidad,
          notas,
          productos(nombre),
          origen:almacenes!movimientos_almacen_origen_id_fkey(nombre),
          destino:almacenes!movimientos_almacen_destino_id_fkey(nombre)
        `)
        .eq("tipo", "transferencia")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const history = data.map(item => ({
          id: item.id,
          fecha: new Date(item.created_at).toLocaleDateString(),
          origen: item.origen?.nombre || "N/A",
          destino: item.destino?.nombre || "N/A",
          producto: item.productos?.nombre || "N/A",
          cantidad: Number(item.cantidad),
          notas: item.notas,
        }));
        
        setTransferHistory(history);
      }
    } catch (error) {
      console.error("Error fetching transfer history:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de transferencias.",
        variant: "destructive",
      });
    } finally {
      setIsHistoryLoading(false);
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
      // Use explicit typed parameters for the RPC calls
      const { error: sourceError } = await supabase.rpc(
        "update_inventory", 
        {
          p_producto_id: data.product,
          p_almacen_id: data.sourceStore,
          p_cantidad: -data.quantity
        }
      );
      
      if (sourceError) {
        console.error("Source error:", sourceError);
        throw sourceError;
      }
      
      const { error: targetError } = await supabase.rpc(
        "update_inventory", 
        {
          p_producto_id: data.product,
          p_almacen_id: data.targetStore,
          p_cantidad: data.quantity
        }
      );
      
      if (targetError) {
        console.error("Target error:", targetError);
        throw targetError;
      }
      
      const { error: movementError } = await supabase
        .from("movimientos")
        .insert({
          tipo: "transferencia",
          producto_id: data.product,
          almacen_origen_id: data.sourceStore,
          almacen_destino_id: data.targetStore,
          cantidad: data.quantity,
          notas: data.notes || null,
        });
      
      if (movementError) {
        console.error("Movement error:", movementError);
        throw movementError;
      }

      toast({
        title: "Transferencia exitosa",
        description: `Se han transferido ${data.quantity} unidades correctamente.`,
      });
      
      form.reset();
      setSelectedSourceStore(null);
      setSelectedProduct(null);
      fetchTransferHistory();
    } catch (error) {
      console.error("Error during transfer:", error);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Transferir Inventario</CardTitle>
          <CardDescription>
            Mueva productos entre sucursales
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transferencias</CardTitle>
          <CardDescription>
            Últimas 10 transferencias realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Cargando historial...</p>
            </div>
          ) : transferHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Package className="h-12 w-12 mb-2" />
              <p className="text-base">No hay transferencias registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferHistory.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{transfer.fecha}</TableCell>
                    <TableCell>{transfer.producto}</TableCell>
                    <TableCell>{transfer.origen}</TableCell>
                    <TableCell>{transfer.destino}</TableCell>
                    <TableCell>{transfer.cantidad}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
