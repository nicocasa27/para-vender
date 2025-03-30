
export interface UserRole {
  id: string;
  role: string;
  created_at?: string;
  almacen_id?: string | null;
  almacen_nombre?: string | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: UserRole[];
}
