
import { Database } from "@/types/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = "admin" | "manager" | "sales" | "viewer";
export type Role = "admin" | "manager" | "sales" | "viewer";

export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  almacen_nombre?: string | null;
  created_at?: string;
  almacenes?: { 
    nombre: string 
  } | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at?: string;
  roles: UserRoleWithStore[];
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

// Helper function to cast string to UserRole with safe fallback
export function castToUserRole(role: string): UserRole {
  const validRoles: UserRole[] = ["admin", "manager", "sales", "viewer"];
  return validRoles.includes(role as UserRole) ? (role as UserRole) : "viewer";
}
