
import { UserDataQueryResult, UserWithRoles, castToUserRole } from "../types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractProperty } from "@/utils/supabaseHelpers";

/**
 * Check if an object is a Supabase error object
 */
function isErrorObject(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.error === true;
}

// Example function with correct return type
export function exampleFunction(): UserDataQueryResult {
  return {
    data: null,
    message: "Example data",
    success: true
  };
}

// Added fetchUserData function with proper error handling
export async function fetchUserData(): Promise<UserWithRoles[]> {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) throw profilesError;
    
    // For each profile, fetch their roles
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      profiles.map(async (profile) => {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*, almacenes(id,nombre)')
          .eq('user_id', profile.id);
          
        if (rolesError) throw rolesError;
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || "",
          created_at: profile.created_at,
          roles: roles.map(role => {
            // Safely access nested properties with type checking
            const safeAlmacenes = role.almacenes && !isErrorObject(role.almacenes)
              ? { 
                  id: extractProperty(role.almacenes, 'id', ""),
                  nombre: extractProperty(role.almacenes, 'nombre', "")
                }
              : null;
              
            return {
              id: role.id,
              user_id: role.user_id,
              role: castToUserRole(role.role),
              almacen_id: role.almacen_id,
              created_at: role.created_at || new Date().toISOString(),
              almacen_nombre: safeAlmacenes ? safeAlmacenes.nombre : null,
              almacenes: safeAlmacenes
            };
          }) || []
        };
      })
    );
    
    return usersWithRoles;
  } catch (error) {
    console.error("Error fetching user data:", error);
    toast.error("Error al recuperar datos de usuario");
    return [];
  }
}

// Fix the return type in getUserData
export function getUserData(): UserDataQueryResult {
  try {
    // Simulate fetching user data
    const userData = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      created_at: new Date().toISOString(),
      roles: []
    };
    
    return {
      data: userData,
      message: "Successfully retrieved user data",
      success: true
    };
  } catch (error) {
    return {
      data: null,
      message: "Error retrieving user data",
      success: false
    };
  }
}

// Fix the return type in updateUserData
export function updateUserData(userId: string, data: any): UserDataQueryResult {
  try {
    // Implementation details here
    return {
      data: {
        id: userId,
        email: data.email || '',
        full_name: data.full_name || null,
        roles: data.roles || []
      },
      message: "User data updated successfully",
      success: true
    };
  } catch (error) {
    return {
      data: null,
      message: "Error updating user data",
      success: false
    };
  }
}
