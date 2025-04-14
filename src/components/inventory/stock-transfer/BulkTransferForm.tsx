
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRightLeft, Plus, Trash, Package } from "lucide-react";
import { StoreSelector } from "../StoreSelector";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductStock } from "./types";
import { getProductsInStore } from "./stock-transfer-api";

// Schema para una transferencia individual en el formulario
const transferItemSchema = z.object({
  productId: z.string().min(1, { message: "Producto es requerido" }),
  quantity: z.coerce.number().positive({ message: "La cantidad debe ser mayor a 0" }),
});

// Schema para el formulario completo
const bulkTransferSchema = z.object({
  sourceStoreId: z.string().min(1, { message: "Origen es requerido" }),
  targetStoreId: z.string().min(1, { message: "Destino es requerido" }),
  items: z.array(transferItemSchema).min(1, { message: "Debe agregar al menos un producto" }),
  notes: z.string().optional(),
}).refine(data => data.sourceStoreId !== data.targetStoreId, {
  message: "El origen y destino no pueden ser el mismo",
  path: ["targetStoreId"],
});

// Tipo para un ítem de transferencia
type TransferItem = {
  productId: string;
  quantity: number;
};

interface BulkTransferFormProps {
  onTransferComplete: () => void;
}

export function BulkTransferForm({ onTransferComplete }: BulkTransferFormProps) {
  const [sourceStore, setSourceStore] = useState<string | null>(null);
  const [targetStore, setTargetStore] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<ProductStock[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<(ProductStock & { quantity: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [productError, setProductError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof bulkTransferSchema>>({
    resolver: zodResolver(bulkTransferSchema),
    defaultValues: {
      sourceStoreId: "",
      targetStoreId: "",
      items: [],
      notes: "",
    },
  });

  // Actualizar los valores del formulario cuando cambian las tiendas
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

    // Reiniciar productos seleccionados si cambia la tienda de origen
    setSelectedProducts([]);
    form.setValue("items", []);
  }, [sourceStore, targetStore, form]);

  // Cargar productos disponibles cuando cambia la tienda origen
  useEffect(() => {
    if (!sourceStore) {
      setAvailableProducts([]);
      setProductError(null);
      return;
    }

    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setProductError(null);
      
      try {
        // Usar la función de la API para obtener productos
        const products = await getProductsInStore(sourceStore);
        
        console.log("Productos cargados:", products);
        
        if (products.length === 0) {
          setProductError("No hay productos con stock disponible en la sucursal de origen.");
        }
        
        setAvailableProducts(products);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        setProductError("Error al cargar los productos. Inténtelo de nuevo.");
        toast.error("Error al cargar los productos");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [sourceStore]);

  // Agregar un producto a la lista de seleccionados
  const handleAddProduct = () => {
    if (!currentProduct || currentQuantity <= 0) {
      toast.error("Seleccione un producto y una cantidad válida");
      return;
    }

    const product = availableProducts.find(p => p.id === currentProduct);
    if (!product) {
      toast.error("Producto no encontrado");
      return;
    }

    if (currentQuantity > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock} ${product.unidad}`);
      return;
    }

    if (selectedProducts.some(p => p.id === currentProduct)) {
      toast.error("Este producto ya está en la lista");
      return;
    }

    const newProduct = {
      ...product,
      quantity: currentQuantity
    };

    const updatedProducts = [...selectedProducts, newProduct];
    setSelectedProducts(updatedProducts);

    // Actualizar el formulario con los nuevos items
    const formItems: TransferItem[] = updatedProducts.map(p => ({
      productId: p.id,
      quantity: p.quantity
    }));
    form.setValue("items", formItems);

    // Limpiar selección actual
    setCurrentProduct("");
    setCurrentQuantity(1);
  };

  // Eliminar un producto de la lista
  const handleRemoveProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(p => p.id !== productId);
    setSelectedProducts(updatedProducts);

    // Actualizar el formulario
    const formItems: TransferItem[] = updatedProducts.map(p => ({
      productId: p.id,
      quantity: p.quantity
    }));
    form.setValue("items", formItems);
  };

  // Procesar el envío del formulario
  const onSubmit = async (data: z.infer<typeof bulkTransferSchema>) => {
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto para transferir");
      return;
    }

    setIsLoading(true);
    
    try {
      // Crear un array de promesas para todas las transferencias
      const transferPromises = data.items.map(async (item) => {
        const product = selectedProducts.find(p => p.id === item.productId);
        if (!product) return null;

        // Obtener el inventario actual en la tienda origen
        const { data: sourceInventory, error: sourceError } = await supabase
          .from("inventario")
          .select("id, cantidad")
          .eq("producto_id", item.productId)
          .eq("almacen_id", data.sourceStoreId)
          .single();
        
        if (sourceError) throw sourceError;
        
        // Verificar stock suficiente
        if (Number(sourceInventory.cantidad) < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.nombre}`);
        }
        
        // Actualizar inventario origen (reducir)
        const newSourceQuantity = Number(sourceInventory.cantidad) - item.quantity;
        const { error: updateSourceError } = await supabase
          .from("inventario")
          .update({ cantidad: newSourceQuantity })
          .eq("id", sourceInventory.id);
        
        if (updateSourceError) throw updateSourceError;
        
        // Verificar si el producto existe en la tienda destino
        const { data: targetInventory, error: targetCheckError } = await supabase
          .from("inventario")
          .select("id, cantidad")
          .eq("producto_id", item.productId)
          .eq("almacen_id", data.targetStoreId)
          .maybeSingle();
        
        if (targetCheckError) throw targetCheckError;
        
        if (targetInventory) {
          // Actualizar inventario destino (incrementar)
          const newTargetQuantity = Number(targetInventory.cantidad) + item.quantity;
          const { error: updateTargetError } = await supabase
            .from("inventario")
            .update({ cantidad: newTargetQuantity })
            .eq("id", targetInventory.id);
          
          if (updateTargetError) throw updateTargetError;
        } else {
          // Crear nuevo registro de inventario en tienda destino
          const { error: insertTargetError } = await supabase
            .from("inventario")
            .insert({
              producto_id: item.productId,
              almacen_id: data.targetStoreId,
              cantidad: item.quantity
            });
          
          if (insertTargetError) throw insertTargetError;
        }
        
        // Registrar el movimiento
        const { error: movementError } = await supabase
          .from("movimientos")
          .insert({
            tipo: "transferencia",
            producto_id: item.productId,
            almacen_origen_id: data.sourceStoreId,
            almacen_destino_id: data.targetStoreId,
            cantidad: item.quantity,
            notas: data.notes || `Transferencia masiva: ${product.nombre}`
          });
        
        if (movementError) throw movementError;

        return product.nombre;
      });
      
      // Ejecutar todas las transferencias
      const results = await Promise.all(transferPromises);
      const successfulTransfers = results.filter(r => r !== null).length;
      
      toast.success(`${successfulTransfers} productos transferidos exitosamente`);
      
      // Resetear formulario y selecciones
      form.reset();
      setSelectedProducts([]);
      setSourceStore(null);
      setTargetStore(null);
      
      // Notificar al componente padre para actualizar historial
      onTransferComplete();
      
    } catch (error: any) {
      console.error("Error en la transferencia masiva:", error);
      toast.error("Error al realizar la transferencia", {
        description: error.message || "Ha ocurrido un error inesperado"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calcular el total de productos a transferir
  const totalProductsToTransfer = selectedProducts.length;
  const totalItemsToTransfer = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);

  return (
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

        {/* Selección de productos */}
        {sourceStore && targetStore && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormLabel>Agregar Productos</FormLabel>
                
                {isLoadingProducts && (
                  <div className="py-4 flex justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-2">Cargando productos...</span>
                  </div>
                )}
                
                {productError && !isLoadingProducts && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {productError}
                    </AlertDescription>
                  </Alert>
                )}
                
                {!isLoadingProducts && availableProducts.length > 0 && (
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <FormLabel>Producto</FormLabel>
                      <Select
                        value={currentProduct}
                        onValueChange={setCurrentProduct}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.nombre} - Stock: {product.stock} {product.unidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full md:w-32">
                      <FormLabel>Cantidad</FormLabel>
                      <Input
                        type="number"
                        min="1"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!currentProduct}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                )}
                
                {/* Lista de productos seleccionados */}
                {selectedProducts.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Productos a transferir:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Disponible</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.nombre}</TableCell>
                            <TableCell>
                              {product.quantity} {product.unidad}
                            </TableCell>
                            <TableCell>
                              {product.stock} {product.unidad}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-between mt-4">
                      <Badge variant="outline" className="text-sm">
                        {totalProductsToTransfer} producto(s) seleccionado(s)
                      </Badge>
                      {totalProductsToTransfer > 1 && (
                        <Badge variant="outline" className="text-sm">
                          Total: {totalItemsToTransfer} unidades
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Errores de validación del formulario */}
                {form.formState.errors.items && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.items.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas adicionales sobre esta transferencia masiva" 
                  {...field} 
                />
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
          disabled={isLoading || !sourceStore || !targetStore || selectedProducts.length === 0} 
          className="w-full"
        >
          {isLoading ? "Procesando..." : (
            <>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transferir {totalProductsToTransfer} Producto{totalProductsToTransfer !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
