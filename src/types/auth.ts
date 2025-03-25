
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  almacen_nombre?: string | null;
  created_at?: string;
  almacenes?: { nombre: string } | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at?: string;
  roles: UserRoleWithStore[];
}
