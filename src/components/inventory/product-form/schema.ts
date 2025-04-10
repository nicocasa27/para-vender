
import { z } from "zod";

export const productFormSchema = z.object({
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

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  initialData?: ProductFormValues;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}
