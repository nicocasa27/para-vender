import { UserWithRoles as AuthUserWithRoles, UserRoleWithStore } from "@/types/auth";

// Extendemos el tipo RoleWithStore para que sea compatible con UserRoleWithStore
export interface RoleWithStore extends UserRoleWithStore {
  created_at: string;  // Hacer que created_at sea requerido
}

// Redefinimos UserWithRoles para que use RoleWithStore en lugar de UserRoleWithStore
export interface UserWithRoles extends Omit<AuthUserWithRoles, 'roles'> {
  roles: RoleWithStore[];
}

// Definir UserRole para compatibilidad con useUserRoles
export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "manager" | "sales" | "viewer";
  almacen_id: string;
  created_at: string;
  email?: string;
  full_name?: string;
  almacen_nombre?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  almacenes?: {
    id: string;
    nombre: string;
  };
}

// Definir el tipo de resultado para userDataQueries
export interface UserDataQueryResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: any;
}
