
export interface UserRole {
  id: string;
  role: string;
  created_at: string;
  almacen_id?: string | null;
  almacen_nombre?: string | null;
  almacenes?: { nombre: string } | null;
  user_id?: string;
  full_name?: string | null;
  email?: string;
}

export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: string;
  almacen_id: string | null;
  created_at: string;
  email?: string;
  full_name?: string | null;
  almacen_nombre?: string | null;
  almacenes?: { nombre: string } | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: UserRole[];
}
