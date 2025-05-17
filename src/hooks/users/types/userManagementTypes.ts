

// Define types for user management

export interface UserDataQueryResult {
  data: any;
  message: string;
  success?: boolean;
}

export type Role = "admin" | "manager" | "sales" | "viewer";
export type UserRole = "admin" | "manager" | "sales" | "viewer";

export interface UserRoleObj {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  created_at?: string;
  full_name?: string;
  email?: string;
  almacen_nombre?: string | null;
}

export interface RoleWithStore {
  id: string;
  user_id: string;
  role: UserRole;
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

export interface UserRoleWithName {
  id: string;
  user_id: string;
  role: UserRole;
  almacen_id: string | null;
  created_at?: string;
  email?: string | null;
  full_name?: string | null;
  almacen_nombre?: string | null;
  tenant_id?: string | null;
}

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at?: string;
  roles: RoleWithStore[];
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

/**
 * Helper function to safely cast a string to UserRole
 * @param role The role string to cast
 * @returns A valid UserRole
 */
export function castToUserRole(role: string): UserRole {
  const validRoles: UserRole[] = ["admin", "manager", "sales", "viewer"];
  if (validRoles.includes(role as UserRole)) {
    return role as UserRole;
  }
  return "viewer"; // Default role if invalid
}

// Helper function to safely handle Supabase query results
export function safeGetProperty<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | null {
  if (!obj) return null;
  return obj[key];
}

// Utility for checking if object has error property
export function isErrorObject(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.error === true;
}

// Safe property accessor for handling SelectQueryError objects
export function safeAccess<T>(obj: any, property: string, defaultValue: T): T {
  if (!obj || obj.error === true) {
    return defaultValue;
  }
  
  try {
    return (obj[property] !== undefined) ? obj[property] : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
