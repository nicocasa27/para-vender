import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRoleWithStore } from "@/types/auth";

export async function addUserRole(userId: string, role: string, storeId?: string) {
  try {
    // Check if user exists
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    if (!userExists) {
      throw new Error("User not found");
    }

    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role);
      
    if (rolesError) throw rolesError;
    
    if (existingRoles && existingRoles.length > 0) {
      // User already has this role
      return existingRoles[0];
    }
    
    // Insert new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role,
          almacen_id: storeId || null
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error in addUserRole:", error);
    throw error;
  }
}

export async function getUserById(userId: string): Promise<UserWithRoles> {
  try {
    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;
    
    // Get user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        profiles!user_roles_user_id_fkey(id, email, full_name),
        almacenes(nombre)
      `)
      .eq('user_id', userId);
      
    if (rolesError) throw rolesError;
    
    // Ensure profile data is properly structured
    const profile = profileData ? {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name,
      created_at: profileData.created_at
    } : null;
    
    // Process roles data - handle either array or single object response
    const roles = rolesData.map(role => {
      const profilesData = role.profiles;
      let email = '';
      let fullName = '';
      
      // Handle the profiles data which might be an array or object
      if (profilesData) {
        if (Array.isArray(profilesData)) {
          // Handle array case
          if (profilesData.length > 0) {
            email = profilesData[0].email || '';
            fullName = profilesData[0].full_name || '';
          }
        } else {
          // Handle object case
          email = profilesData.email || '';
          fullName = profilesData.full_name || '';
        }
      }
      
      // Handle almacenes data which might be an array or object
      const almacenesData = role.almacenes;
      let almacenNombre = '';
      
      if (almacenesData) {
        if (Array.isArray(almacenesData)) {
          // Handle array case
          if (almacenesData.length > 0) {
            almacenNombre = almacenesData[0].nombre || '';
          }
        } else {
          // Handle object case
          almacenNombre = almacenesData.nombre || '';
        }
      }
      
      // Return processed role
      return {
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        almacen_id: role.almacen_id,
        almacen_nombre: almacenNombre,
        created_at: role.created_at
      } as UserRoleWithStore;
    });
    
    // Return combined user object
    return {
      id: userId,
      email: profile?.email || '',
      full_name: profile?.full_name || '',
      created_at: profile?.created_at,
      roles: roles
    };
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}

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
