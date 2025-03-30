
export type UserRole = 'admin' | 'manager' | 'sales' | 'viewer';

export interface RoleWithStore {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  created_at: string;
  email?: string;
  full_name?: string | null;
  almacen_nombre?: string | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at?: string;
  roles: RoleWithStore[];
}
