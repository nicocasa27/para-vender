
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
        console.log("Fetching form data (categories, units, warehouses)...");
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categorias")
          .select("id, nombre");
        
        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
          throw categoriesError;
        }
        
        console.log("Categories fetched:", categoriesData?.length || 0);
        
        // Filter valid categories
        const validCategories = categoriesData
          ?.filter(cat => !!cat.id && !!cat.nombre && cat.id.trim() !== "")
          .map(cat => ({ id: cat.id, name: cat.nombre })) || [];
          
        console.log("Valid categories:", validCategories.length);
        setCategories(validCategories);
        
        // Fetch units
        const { data: unitsData, error: unitsError } = await supabase
          .from("unidades")
          .select("id, nombre");
        
        if (unitsError) {
          console.error("Error fetching units:", unitsError);
          throw unitsError;
        }
        
        console.log("Units fetched:", unitsData?.length || 0);
        
        // Filter valid units
        const validUnits = unitsData
          ?.filter(unit => !!unit.id && !!unit.nombre && unit.id.trim() !== "")
          .map(unit => ({ id: unit.id, name: unit.nombre })) || [];
          
        console.log("Valid units:", validUnits.length);
        setUnits(validUnits);

        // Fetch warehouses
        const { data: warehousesData, error: warehousesError } = await supabase
          .from("almacenes")
          .select("id, nombre");
        
        if (warehousesError) {
          console.error("Error fetching warehouses:", warehousesError);
          throw warehousesError;
        }
        
        console.log("Warehouses fetched:", warehousesData?.length || 0);
        
        // Filter valid warehouses
        const validWarehouses = warehousesData
          ?.filter(warehouse => !!warehouse.id && !!warehouse.nombre && warehouse.id.trim() !== "")
          .map(warehouse => ({ id: warehouse.id, name: warehouse.nombre })) || [];
          
        console.log("Valid warehouses:", validWarehouses.length);
        setWarehouses(validWarehouses);
        
      } catch (error) {
        console.error("Error fetching form data:", error);
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
    console.log("Form data being submitted:", data);
    onSubmit(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if we have required data
  if (categories.length === 0 || units.length === 0 || (!isEditing && warehouses.length === 0)) {
    console.warn("Missing required data:", {
      categories: categories.length,
      units: units.length,
      warehouses: warehouses.length
    });
    
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          No se pudieron cargar los datos necesarios
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          Asegúrese de que existan categorías, unidades y sucursales en el sistema antes de continuar.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Intentar nuevamente
        </Button>
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
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
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
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
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
