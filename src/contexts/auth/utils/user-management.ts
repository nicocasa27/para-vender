import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRoleWithStore } from "@/types/auth";

/**
 * Fetch all users with their roles
 */
export async function fetchAllUsers(): Promise<UserWithRoles[]> {
  try {
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) throw profilesError;
    
    if (!profiles || profiles.length === 0) {
      return [];
    }
    
    // Fetch all roles in a single query
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        profiles(*),
        almacenes(*)
      `);
      
    if (rolesError) throw rolesError;
    
    // Create a map of user_id -> roles for efficient access
    const userRolesMap = new Map<string, UserRoleWithStore[]>();
    
    if (rolesData && rolesData.length > 0) {
      rolesData.forEach(role => {
        const userId = role.user_id;
        
        if (!userRolesMap.has(userId)) {
          userRolesMap.set(userId, []);
        }
        
        // Safely handle nested properties
        const profilesData = role.profiles;
        let email = '';
        let fullName = '';
        
        if (profilesData) {
          if (Array.isArray(profilesData)) {
            if (profilesData.length > 0) {
              // Access properties safely from the first item in the array
              email = profilesData[0]?.email || '';
              fullName = profilesData[0]?.full_name || '';
            }
          } else {
            // Handle object case
            email = profilesData.email || '';
            fullName = profilesData.full_name || '';
          }
        }
        
        // Safely handle almacenes data
        const almacenesData = role.almacenes;
        let almacenNombre = '';
        
        if (almacenesData) {
          if (Array.isArray(almacenesData)) {
            if (almacenesData.length > 0) {
              // Access nombre safely from the first item in the array
              almacenNombre = almacenesData[0]?.nombre || '';
            }
          } else {
            // Handle object case
            almacenNombre = almacenesData.nombre || '';
          }
        }
        
        const userRole: UserRoleWithStore = {
          id: role.id,
          user_id: role.user_id,
          role: role.role,
          almacen_id: role.almacen_id,
          almacen_nombre: almacenNombre,
          created_at: role.created_at
        };
        
        userRolesMap.get(userId)?.push(userRole);
      });
    }
    
    // Map profiles to UserWithRoles objects
    const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
      const roles = userRolesMap.get(profile.id) || [];
      
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        created_at: profile.created_at,
        roles
      };
    });
    
    return usersWithRoles;
  } catch (error) {
    console.error("Error in fetchAllUsers:", error);
    throw error;
  }
}

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
