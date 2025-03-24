
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = "admin" | "manager" | "sales" | "viewer";

export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  almacen_nombre?: string;
  created_at: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: UserRoleWithStore[];
}
