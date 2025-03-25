
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";

/**
 * Obtiene todos los usuarios con sus roles
 */
export const fetchAllUsers = async (): Promise<UserWithRoles[]> => {
  try {
    console.log("AuthUtils: Fetching all users");
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error("AuthUtils: Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log("AuthUtils: No profiles found");
      return [];
    }
    
    console.log(`AuthUtils: Found ${profiles.length} profiles`);
    
    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
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
    
    // Combine data
    const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
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
    
    console.log(`AuthUtils: Processed ${usersWithRoles.length} users with roles`);
    return usersWithRoles;
  } catch (error) {
    console.error("AuthUtils: Error in fetchAllUsers:", error);
    throw error;
  }
};
