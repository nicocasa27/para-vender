
// We need to update this file with the correct types to fix type errors
// Update the array assignment errors and property access issues

import { supabase } from "@/integrations/supabase/client";
import { UserRole, UserRoleWithStore, UserWithRoles } from "@/types/auth";
import { extractProperty, safeCast } from "@/utils/supabaseHelpers";

// Helper function to safely cast to UserRole with proper types 
export function safelyExtractRole(role: string): UserRole {
  // Create a valid array for use with safeCast
  const validRoles = ["admin", "manager", "sales", "viewer"] as const;
  return safeCast(role, validRoles, "viewer");
}

/**
 * Safely handle potential Supabase errors when accessing properties
 */
export function safeAccess<T>(obj: any, key: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  
  try {
    if (obj.error === true) return defaultValue;
    return (obj[key] !== undefined && obj[key] !== null) ? obj[key] : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Fetches all users with their roles
 */
export async function fetchAllUsers(): Promise<UserWithRoles[]> {
  try {
    console.log('Fetching all users...');
    
    // First try to use the user_roles_with_name view for better performance
    const { data: viewData, error: viewError } = await supabase
      .from('user_roles_with_name')
      .select('*');
      
    if (!viewError && viewData && viewData.length > 0) {
      return processViewData(viewData);
    }
    
    // Fallback: fetch data through multiple queries
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) throw profilesError;
      
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      profiles.map(async profile => {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*, almacenes(*)')
          .eq('user_id', profile.id);
          
        if (rolesError) throw rolesError;
        
        const roles = rolesData.map(role => {
          // Safely access nested properties
          const almacenNombre = role.almacenes && !isErrorObject(role.almacenes)
            ? extractProperty(role.almacenes, 'nombre', null)
            : null;
          
          // Use a proper type cast for the role
          const processedRole: UserRoleWithStore = {
            id: role.id,
            user_id: role.user_id,
            role: safelyExtractRole(role.role),
            almacen_id: role.almacen_id,
            created_at: role.created_at || new Date().toISOString(),
            almacen_nombre: almacenNombre
          };
          
          return processedRole;
        });
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || "",
          roles: roles
        };
      })
    );
    
    return usersWithRoles;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

/**
 * Process user data from user_roles_with_name view
 */
function processViewData(viewData: any[]): UserWithRoles[] {
  try {
    // Map to group roles by user
    const userMap = new Map<string, UserWithRoles>();
    
    viewData.forEach(row => {
      const userId = row.user_id;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userId,
          email: safeAccess(row, 'email', ""),
          full_name: safeAccess(row, 'full_name', ""),
          roles: []
        });
      }
      
      // Get the user entry from our map
      const userEntry = userMap.get(userId);
      
      if (userEntry) {
        // Process the role safely
        userEntry.roles.push({
          id: row.id || "",
          user_id: userId,
          role: safelyExtractRole(row.role),
          almacen_id: row.almacen_id || null,
          created_at: row.created_at || new Date().toISOString(),
          almacen_nombre: safeAccess(row, 'almacen_nombre', null)
        });
      }
    });
    
    // Convert map to array
    return Array.from(userMap.values());
  } catch (error) {
    console.error('Error processing view data:', error);
    return [];
  }
}

// Helper function to check if an object is an error object
function isErrorObject(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.error === true;
}
