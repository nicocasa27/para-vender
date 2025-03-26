
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";

/**
 * Obtiene todos los usuarios con sus roles
 */
export const fetchAllUsers = async (): Promise<UserWithRoles[]> => {
  try {
    console.log("AuthUtils: Fetching all users with roles");
    
    // Fetch all profiles with their roles using JOIN
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        user_roles(
          id,
          user_id,
          role,
          almacen_id,
          created_at,
          almacenes:almacen_id(nombre)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("AuthUtils: Error fetching profiles with roles:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("AuthUtils: No profiles found");
      return [];
    }
    
    console.log(`AuthUtils: Found ${data.length} profiles with roles`);
    
    // Transform the data to match our expected format
    const usersWithRoles: UserWithRoles[] = data.map(profile => {
      const userRoles = (profile.user_roles || []).map(role => ({
        ...role,
        almacen_nombre: role.almacenes?.nombre || null
      }));
      
      return {
        id: profile.id,
        email: profile.email || "",
        full_name: profile.full_name || null,
        created_at: profile.created_at,
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
