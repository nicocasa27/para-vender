
// Fix type issues in user-roles.ts

import { supabase } from "@/integrations/supabase/client";
import { UserRole, UserRoleWithStore } from "@/types/auth";

/**
 * Safely cast a string to UserRole
 */
function safeRoleCast(role: string): UserRole {
  const validRoles = ["admin", "manager", "sales", "viewer"] as UserRole[];
  return validRoles.includes(role as UserRole) ? (role as UserRole) : "viewer";
}

/**
 * Safely handle potentially null properties
 */
function safeProperty<T>(obj: any, prop: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  try {
    if (obj.error === true) return defaultValue;
    return (obj[prop] !== undefined && obj[prop] !== null) ? obj[prop] : defaultValue;
  } catch (e) {
    console.error(`Error accessing property ${prop}:`, e);
    return defaultValue;
  }
}

/**
 * Check if a user has a specific role
 */
export function checkHasRole(roles: UserRoleWithStore[], role: UserRole, storeId?: string): boolean {
  // Admin always has access to everything
  if (roles.some(r => r.role === "admin")) return true;
  
  // Check for specific role and optional storeId
  return roles.some(r => {
    if (r.role !== role) return false;
    if (storeId && r.almacen_id !== storeId) return false;
    return true;
  });
}

/**
 * Fetch roles for a specific user
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  try {
    console.log(`Fetching roles for user ${userId}`);
    
    // Try view first
    const { data: viewData, error: viewError } = await supabase
      .from('user_roles_with_name')
      .select('*')
      .eq('user_id', userId);
      
    if (!viewError && viewData && viewData.length > 0) {
      console.log(`Found ${viewData.length} roles for user from view`);
      
      return viewData.map(row => ({
        id: row.id,
        user_id: row.user_id,
        role: safeRoleCast(row.role), 
        almacen_id: row.almacen_id,
        created_at: row.created_at || new Date().toISOString(),
        almacen_nombre: row.almacen_nombre || null
      }));
    }
    
    // Fallback to regular query
    console.log("View query failed, falling back to regular query");
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*, almacenes(*)')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (!roles || roles.length === 0) {
      console.log("No roles found for user");
      return [];
    }
    
    console.log(`Found ${roles.length} roles for user from regular query`);
    
    return roles.map(role => ({
      id: role.id,
      user_id: role.user_id,
      role: safeRoleCast(role.role),
      almacen_id: role.almacen_id,
      created_at: role.created_at || new Date().toISOString(),
      // Safe access to potentially null/error properties
      almacen_nombre: safeProperty(role.almacenes, 'nombre', null)
    }));
    
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
}
