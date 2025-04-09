
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
import { Loader } from "lucide-react";
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
  
  // Cargar categorías, unidades y almacenes directamente en el componente
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

  // Log inicial para debuggear
  useEffect(() => {
    console.log("ProductForm montado - isEditing:", isEditing);
    console.log("ProductForm - initialData:", initialData);
  }, [isEditing, initialData]);

  // Intentar recargar los datos cuando se monta el componente
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

  // Log para debugging
  useEffect(() => {
    console.log("ProductForm - Estado actual:", { 
      categoriesCount: categories.length, 
      unitsCount: units.length,
      warehousesCount: warehouses.length,
      hasMetadata,
      isLoading
    });
  }, [categories.length, units.length, warehouses.length, hasMetadata, isLoading]);

  // Crear defaultValues con valores iniciales o valores por defecto
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
    ...initialData // Sobrescribir con datos iniciales si existen
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log("Resetting form with initial data:", initialData);
      form.reset(initialData);
    }
  }, [form, initialData]);

  const handleFormSubmit = (data: ProductFormValues) => {
    console.log("✅ handleFormSubmit ejecutado con:", data);
    
    // Validar que hay categorías y unidades antes de enviar
    if (categories.length === 0 || units.length === 0) {
      toast.error("Datos incompletos", {
        description: "No hay categorías o unidades disponibles. Por favor, crea primero estos valores."
      });
      return;
    }
    
    // Validar que se seleccionó un almacén si es necesario
    if (!isEditing && !data.warehouse && warehouses.length > 0) {
      toast.error("Por favor seleccione un almacén");
      return;
    }
    
    // Llamar al onSubmit pasado como prop (que eventualmente debería llegar a updateProduct)
    onSubmit(data);
  };

  // Mostrar indicador de carga durante la carga inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos necesarios...</span>
      </div>
    );
  }

  // Verificar datos requeridos antes de mostrar el formulario
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

  // Si estamos editando y faltan almacenes, no es un problema crítico
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6 animate-fade-in"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <SelectItem key={unit.id} value={unit.id}>
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un almacén" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.nombre}
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

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => form.reset(defaultValues)}
          >
            Restablecer
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Actualizar Producto" : "Agregar Producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
