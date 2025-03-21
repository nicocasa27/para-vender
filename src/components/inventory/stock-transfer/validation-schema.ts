
import * as z from "zod";

export const stockTransferSchema = z.object({
  sourceStoreId: z.string({
    required_error: "Seleccione la sucursal de origen",
  }),
  targetStoreId: z.string({
    required_error: "Seleccione la sucursal de destino",
  }),
  productId: z.string({
    required_error: "Seleccione el producto a transferir",
  }),
  quantity: z.coerce.number()
    .positive({
      message: "La cantidad debe ser un número positivo",
    }),
  notes: z.string().optional(),
}).refine(data => data.sourceStoreId !== data.targetStoreId, {
  message: "Las sucursales de origen y destino deben ser diferentes",
  path: ["targetStoreId"],
});

export type StockTransferFormValues = z.infer<typeof stockTransferSchema>;
