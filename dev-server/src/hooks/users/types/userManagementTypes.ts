
// Adding types needed for UserDataQueryResult to resolve build errors

export interface UserDataQueryResult {
  data: any;
  message: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  almacen_id: string | null;
  created_at?: string;
  full_name?: string;
  email?: string;
  almacen_nombre?: string | null;
}

export interface RoleWithStore {
  id: string;
  user_id: string;
  role: string;
  almacen_id: string | null;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string;
  };
  almacenes?: {
    id: string;
    nombre: string;
  } | null;
  almacen_nombre?: string | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: RoleWithStore[];
}
