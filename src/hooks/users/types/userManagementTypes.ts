
import { UserWithRoles } from "@/types/auth";

// Define la interface para la estructura de datos de user_roles_with_name
export interface UserRoleWithName {
  id?: string;
  user_id: string;
  role: "admin" | "manager" | "sales" | "viewer";
  almacen_id: string | null;
  created_at: string;
  full_name: string | null;
  email: string | null;
  almacen_nombre?: string | null;
}

// Resultado de una consulta a la vista o tablas
export interface UserDataQueryResult {
  success: boolean;
  data?: UserWithRoles[];
  error?: any;
}
