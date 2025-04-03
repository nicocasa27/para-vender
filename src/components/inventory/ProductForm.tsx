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
import { supabase } from "@/integrations/supabase/client";

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
  const { toast } = useToast();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [units, setUnits] = useState<{id: string, name: string}[]>([]);
  const [warehouses, setWarehouses] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener categorías
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categorias")
          .select("id, nombre");
        
        if (categoriesError) throw categoriesError;
        
        setCategories(categoriesData
          .filter(cat => !!cat.id && !!cat.nombre)
          .map(cat => ({ id: cat.id, name: cat.nombre }))
        );
        
        // Obtener unidades
        const { data: unitsData, error: unitsError } = await supabase
          .from("unidades")
          .select("id, nombre");
        
        if (unitsError) throw unitsError;
        
        setUnits(unitsData
          .filter(unit => !!unit.id && !!unit.nombre)
          .map(unit => ({ id: unit.id, name: unit.nombre }))
        );

        // Obtener almacenes
        const { data: warehousesData, error: warehousesError } = await supabase
          .from("almacenes")
          .select("id, nombre");
        
        if (warehousesError) throw warehousesError;
        
        setWarehouses(warehousesData
          .filter(warehouse => !!warehouse.id && !!warehouse.nombre)
          .map(warehouse => ({ id: warehouse.id, name: warehouse.nombre }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);

  const defaultValues: Partial<ProductFormValues> = initialData || {
    name: "",
    category: "",
    unit: "",
    purchasePrice: 0,
    salePrice: 0,
    minStock: 0,
    maxStock: 0,
    initialStock: 0,
    warehouse: "",
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: ProductFormValues) => {
    onSubmit(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
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
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id || "no-id"}>
                        {category.name || "Sin nombre"}
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
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo de unidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id || "no-id"}>
                        {unit.name || "Sin nombre"}
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
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un almacén" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id || "no-id"}>
                            {warehouse.name || "Sin nombre"}
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
