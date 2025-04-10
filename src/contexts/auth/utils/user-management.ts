
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRoleWithStore } from "@/types/auth";

/**
 * Obtiene todos los usuarios con sus roles
 */
export const fetchAllUsers = async (): Promise<UserWithRoles[]> => {
  try {
    console.log("AuthUtils: Fetching all users with roles");
    
    // Fetch all users with their roles using a direct query to user_roles
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        profiles:user_id(
          id,
          email,
          full_name
        ),
        almacenes:almacen_id(nombre)
      `)
      .order('created_at', { ascending: false });
      
    if (userRolesError) {
      console.error("AuthUtils: Error fetching user roles:", userRolesError);
      throw userRolesError;
    }
    
    // Get unique user IDs from the roles
    const userIds = [...new Set(userRolesData.map(role => role.user_id))];
    
    if (userIds.length === 0) {
      console.log("AuthUtils: No user roles found");
      
      // Fetch profiles without roles as a fallback
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
      
      // Transform profile data to match UserWithRoles format (normalizado)
      return profiles.map(profile => ({
        id: profile.id,
        email: profile.email || "",
        full_name: profile.full_name || null,
        created_at: profile.created_at,
        roles: []
      }));
    }
    
    // Group roles by user
    const usersMap = new Map<string, UserWithRoles>();
    
    // Process each role and group by user_id
    userRolesData.forEach(role => {
      const userId = role.user_id;
      const profileData = role.profiles;
      
      // If this user isn't in our map yet, add them
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          id: userId,
          email: profileData ? profileData.email || "" : "",
          full_name: profileData ? profileData.full_name || null : null,
          created_at: role.created_at,
          roles: []
        });
      }
      
      // Add this role to the user's roles array
      const userEntry = usersMap.get(userId);
      if (userEntry) {
        userEntry.roles.push({
          id: role.id,
          user_id: role.user_id,
          role: role.role as any,
          almacen_id: role.almacen_id,
          created_at: role.created_at,
          almacen_nombre: role.almacenes ? role.almacenes.nombre : null
        });
      }
    });
    
    // Fetch any users without roles to include them too
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error("AuthUtils: Error fetching profiles:", profilesError);
      // Continue with what we have instead of throwing
    } else if (profiles) {
      // Add any profiles that weren't included in the roles query
      profiles.forEach(profile => {
        if (!usersMap.has(profile.id)) {
          usersMap.set(profile.id, {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || null,
            created_at: profile.created_at,
            roles: []
          });
        }
      });
    }
    
    // Convert map values to array
    const usersWithRoles = Array.from(usersMap.values());
    
    console.log(`AuthUtils: Processed ${usersWithRoles.length} users with roles`);
    return usersWithRoles;
  } catch (error) {
    console.error("AuthUtils: Error in fetchAllUsers:", error);
    throw error;
  }
};
