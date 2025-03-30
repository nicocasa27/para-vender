
import { UserRole } from "@/types/auth";

// Define the interface for the structure of data from user_roles table with store
export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  almacen_nombre?: string | null;
  created_at?: string;
  almacenes?: { nombre: string } | null;
}

// Define user with their roles
export interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at?: string;
  roles: UserRoleWithStore[];
  profiles?: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
}

// Result of a query to the view or tables
export interface UserDataQueryResult {
  success: boolean;
  data?: UserWithRoles[];
  error?: any;
}
