
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
 * Create a default role for a user if they don't have any roles
 */
export async function createDefaultRole(userId: string): Promise<boolean> {
  try {
    console.log("Creating default role for user:", userId);
    
    // Check if user already has roles
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking existing roles:", checkError);
      return false;
    }
    
    if (existingRoles && existingRoles.length > 0) {
      console.log("User already has roles, not creating default");
      return true;
    }
    
    // Create default viewer role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'viewer',
        almacen_id: null
      });
      
    if (insertError) {
      console.error("Error creating default role:", insertError);
      return false;
    }
    
    console.log("Default role created successfully for user:", userId);
    return true;
  } catch (error) {
    console.error("Exception creating default role:", error);
    return false;
  }
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
    
    return roles.map(role => {
      // Safe access to potentially null/error properties
      const almacenNombre = role.almacenes && !role.almacenes.error 
        ? role.almacenes.nombre 
        : null;
      
      return {
        id: role.id,
        user_id: role.user_id,
        role: safeRoleCast(role.role),
        almacen_id: role.almacen_id,
        created_at: role.created_at || new Date().toISOString(),
        almacen_nombre: almacenNombre
      };
    });
    
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
}
