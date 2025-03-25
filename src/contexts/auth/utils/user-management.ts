
import { UserWithRoles } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Obtiene todos los usuarios con sus roles correspondientes
 */
export const fetchAllUsers = async (): Promise<UserWithRoles[]> => {
  try {
    console.log("AuthUtils: Fetching all users");
    
    // Get all profiles with robust error handling
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");
      
    if (profilesError) {
      console.error("AuthUtils: Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log("AuthUtils: No profiles found");
      return [];
    }
    
    console.log("AuthUtils: Profiles fetched:", profiles.length);
    
    // Get all user roles with better error handling
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        almacenes:almacen_id(nombre)
      `);
      
    if (rolesError) {
      console.error("AuthUtils: Error fetching roles:", rolesError);
      throw rolesError;
    }
    
    console.log("AuthUtils: Roles fetched:", roles?.length || 0);
    
    // Combine the data
    const usersWithRoles = profiles.map(profile => {
      const userRoles = roles
        ?.filter(r => r.user_id === profile.id)
        .map(role => ({
          ...role,
          almacen_nombre: role.almacenes?.nombre || null
        })) || [];
      
      return {
        id: profile.id,
        email: profile.email || "",
        full_name: profile.full_name || null,
        roles: userRoles,
      };
    });
    
    console.log("AuthUtils: Combined users with roles:", usersWithRoles.length);
    return usersWithRoles;
    
  } catch (error) {
    console.error("AuthUtils: Error fetching all users:", error);
    throw error;
  }
};
