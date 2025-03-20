
import * as z from "zod";

export const transferFormSchema = z.object({
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

export type TransferFormValues = z.infer<typeof transferFormSchema>;
