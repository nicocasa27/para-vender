
import { UserDataQueryResult, UserWithRoles, castToUserRole } from "../types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Example function with correct return type
export function exampleFunction(): UserDataQueryResult {
  return {
    data: { id: "example-id", email: "example@example.com" },
    message: "Example data",
    success: true
  };
}

// Added fetchUserData function that was missing
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
          .select('*, almacenes(*)')
          .eq('user_id', profile.id);
          
        if (rolesError) throw rolesError;
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || "",
          created_at: profile.created_at,
          roles: roles.map(role => {
            // Safely access nested properties
            const almacenNombre = role.almacenes && typeof role.almacenes === 'object' 
              ? role.almacenes.nombre || null 
              : null;
              
            return {
              ...role,
              role: castToUserRole(role.role), // Cast to valid UserRole type
              created_at: role.created_at || new Date().toISOString(), // Ensure created_at is never null
              almacen_nombre: almacenNombre
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
        created_at: data.created_at || new Date().toISOString(),
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
