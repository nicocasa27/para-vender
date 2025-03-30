
export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: UserRole[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'sales' | 'viewer';
  almacen_id: string | null;
  created_at: string;
  almacen_nombre?: string | null;
}

export interface UserRoleWithStore {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'sales' | 'viewer';
  almacen_id: string;
  created_at: string;
  email: string;
  full_name: string | null;
  almacen_nombre?: string | null;
}

export interface UserManagementState {
  users: UserWithRoles[];
  loading: boolean;
  error: Error | null;
}
