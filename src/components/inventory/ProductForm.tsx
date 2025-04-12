
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, Save } from "lucide-react";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";

const productFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del producto debe tener al menos 2 caracteres.",
  }),
  category: z.string({
    required_error: "Por favor seleccione una categoría.",
  }),
  unit: z.string({
    required_error: "Por favor seleccione una unidad.",
  }),
  purchasePrice: z.coerce.number().positive({
    message: "El precio de compra debe ser positivo.",
  }),
  salePrice: z.coerce.number().positive({
    message: "El precio de venta debe ser positivo.",
  }),
  minStock: z.coerce.number().int().nonnegative({
    message: "El stock mínimo debe ser un número entero no negativo.",
  }),
  maxStock: z.coerce.number().int().positive({
    message: "El stock máximo debe ser un número entero positivo.",
  }),
  initialStock: z.coerce.number().nonnegative({
    message: "La cantidad inicial debe ser un número no negativo.",
  }),
  warehouse: z.string().optional(),
  store: z.string().optional(),
  color: z.string().optional(),
  talla: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: ProductFormValues;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEditing = false,
}) => {
  const { toast: uiToast } = useToast();
  const [formData, setFormData] = useState<ProductFormValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  
  const { 
    categories, 
    units, 
    isLoading: metadataLoading, 
    hasMetadata, 
    refetch: refetchMetadata 
  } = useProductMetadata();
  
  const { 
    stores: warehouses, 
    isLoading: warehousesLoading, 
    refetch: refetchWarehouses 
  } = useStores();
  
  const isLoading = metadataLoading || warehousesLoading;

  useEffect(() => {
    console.log("ProductForm montado - isEditing:", isEditing);
    console.log("ProductForm - initialData:", initialData);
  }, [isEditing, initialData]);

  useEffect(() => {
    if (!hasMetadata || categories.length === 0 || units.length === 0) {
      console.log("ProductForm - Recargando metadatos...");
      refetchMetadata().catch(error => {
        console.error("Error al recargar metadatos:", error);
      });
    }
    
    if (warehouses.length === 0 && !isEditing) {
      console.log("ProductForm - Recargando almacenes...");
      refetchWarehouses().catch(error => {
        console.error("Error al recargar almacenes:", error);
      });
    }
  }, [hasMetadata, categories.length, units.length, warehouses.length, isEditing, refetchMetadata, refetchWarehouses]);

  useEffect(() => {
    console.log("ProductForm - Estado actual:", { 
      categoriesCount: categories.length, 
      unitsCount: units.length,
      warehousesCount: warehouses.length,
      hasMetadata,
      isLoading
    });
  }, [categories.length, units.length, warehouses.length, hasMetadata, isLoading]);

  const defaultValues: Partial<ProductFormValues> = {
    name: "",
    category: "",
    unit: "",
    purchasePrice: 0,
    salePrice: 0,
    minStock: 0,
    maxStock: 0,
    initialStock: 0,
    warehouse: "",
    store: "",
    color: "",
    talla: "",
    ...initialData
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      console.log("Resetting form with initial data:", initialData);
      
      const formattedData = {
        ...initialData,
        purchasePrice: Number(initialData.purchasePrice) || 0,
        salePrice: Number(initialData.salePrice) || 0,
        minStock: Number(initialData.minStock) || 0,
        maxStock: Number(initialData.maxStock) || 0,
        initialStock: Number(initialData.initialStock) || 0,
        color: initialData.color || "",
        talla: initialData.talla || "",
      };
      
      form.reset(formattedData);
    }
  }, [form, initialData]);

  const handleFormSubmit = async (data: ProductFormValues) => {
    console.log("%c📤 Formulario enviado con datos:", "color: green; font-weight: bold", data);
    
    setFormData(data);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    if (categories.length === 0 || units.length === 0) {
      const errorMsg = "No hay categorías o unidades disponibles. Por favor, crea primero estos valores.";
      setSubmitError(errorMsg);
      toast.error("❌ Datos incompletos", {
        description: errorMsg
      });
      return;
    }
    
    if (!isEditing && !data.warehouse && warehouses.length > 0) {
      const errorMsg = "Por favor seleccione un almacén";
      setSubmitError(errorMsg);
      toast.error("❌ Almacén requerido", {
        description: "Debes seleccionar un almacén para productos nuevos"
      });
      return;
    }
    
    if (isEditing && !data.name) {
      toast.error("❌ Nombre requerido para editar");
      return;
    }
    
    const numericData = {
      ...data,
      purchasePrice: Number(data.purchasePrice) || 0,
      salePrice: Number(data.salePrice) || 0,
      minStock: Number(data.minStock) || 0,
      maxStock: Number(data.maxStock) || 0,
      initialStock: Number(data.initialStock) || 0
    };
    
    toast("📨 Enviando...", { 
      description: isEditing ? "Actualizando producto..." : "Agregando producto..." 
    });
    
    try {
      await onSubmit(numericData);
      setSubmitSuccess(true);
      
      toast.success(isEditing ? "✅ Producto actualizado correctamente" : "✅ Producto agregado correctamente", {
        description: isEditing ? "Los cambios han sido guardados" : "El producto ha sido agregado al inventario"
      });
      
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      const errorMsg = error instanceof Error ? error.message : "Ocurrió un error desconocido";
      setSubmitError(errorMsg);
      toast.error("❌ Error al guardar", {
        description: errorMsg
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos necesarios...</span>
      </div>
    );
  }

  if (!hasMetadata && (categories.length === 0 || units.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          No se pudieron cargar los datos necesarios
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          {categories.length === 0 ? "Faltan categorías. " : ""}
          {units.length === 0 ? "Faltan unidades. " : ""}
          Se intentará crear valores por defecto.
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            refetchMetadata().then(() => {
              toast.success("Datos actualizados");
            });
          }}
        >
          Reintentar carga
        </Button>
      </div>
    );
  }

  if (!isEditing && warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          No se pudieron cargar los almacenes
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          Se necesitan almacenes para agregar inventario inicial.
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            refetchWarehouses().then(() => {
              toast.success("Almacenes actualizados");
            });
          }}
        >
          Reintentar carga
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4 animate-fade-in"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ingrese nombre del producto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nombre}
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Unidad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo de unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id || "unit-sin-id"}>
                          {unit.nombre}
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
              name="store"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal del Producto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="no-store">Sin sucursal asignada</SelectItem>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id || "store-sin-id"}>
                          {warehouse.nombre || "Sin nombre"}
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Rojo, Azul, Negro" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="talla"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Talla (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: S, M, L, XL, 38, 40" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Compra</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Venta</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      {...field}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Máximo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      {...field}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad Inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          {...field}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Almacén</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un almacén" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id || "warehouse-sin-id"}>
                              {warehouse.nombre || "Sin nombre"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          <div className="flex justify-between gap-3 mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => form.reset(defaultValues)}
              className="min-w-[120px]"
            >
              Restablecer
            </Button>
            
            {isEditing ? (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[150px] bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  "Agregar Producto"
                )}
              </Button>
            )}
          </div>
          
          {submitError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <strong>Error:</strong> {submitError}
            </div>
          )}
          
          {submitSuccess && isEditing && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
              <strong>Éxito:</strong> Los cambios han sido guardados correctamente.
            </div>
          )}
          
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Valores actuales del formulario:</h3>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-green-400 rounded">
                {JSON.stringify(form.watch(), null, 2)}
              </pre>
            </div>
          )}
        </form>
      </Form>
      
      {process.env.NODE_ENV === "development" && formData && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Datos que se enviarán a Supabase:</h3>
          <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-green-400 rounded">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
