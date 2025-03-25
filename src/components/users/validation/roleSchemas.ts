
import * as z from "zod";

// Schema con validación para asignación de roles
export const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "Usuario es requerido"),
  role: z.enum(["admin", "manager", "sales", "viewer"] as const),
  almacenId: z.string().optional(),
});

export type RoleAssignmentValues = z.infer<typeof roleAssignmentSchema>;
