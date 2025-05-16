
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRoleWithStore } from "@/types/auth";
import { safeCast } from "@/utils/supabaseHelpers";

// Valid role values for type safety
const validRoles = ["admin", "manager", "sales", "viewer"] as const;
type UserRole = typeof validRoles[number];

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
      .select('*, profiles:profiles(*), almacenes:almacenes(*)');
      
    if (rolesError) throw rolesError;
    
    // Create a map of user_id -> roles for efficient access
    const userRolesMap = new Map<string, UserRoleWithStore[]>();
    
    if (rolesData && rolesData.length > 0) {
      rolesData.forEach(role => {
        const userId = role.user_id;
        
        if (!userRolesMap.has(userId)) {
          userRolesMap.set(userId, []);
        }
        
        // Safely handle profiles data
        let email = '';
        let fullName = '';
        
        // Handle profiles data safely
        if (role.profiles) {
          // Check if it's an array or an object
          if (Array.isArray(role.profiles)) {
            if (role.profiles.length > 0) {
              email = role.profiles[0]?.email || '';
              fullName = role.profiles[0]?.full_name || '';
            }
          } else {
            email = (role.profiles as any).email || '';
            fullName = (role.profiles as any).full_name || '';
          }
        }
        
        // Safely handle almacenes data
        let almacenNombre = '';
        
        if (role.almacenes) {
          // Check if it's an array or an object
          if (Array.isArray(role.almacenes)) {
            if (role.almacenes.length > 0) {
              almacenNombre = role.almacenes[0]?.nombre || '';
            }
          } else {
            almacenNombre = (role.almacenes as any).nombre || '';
          }
        }
        
        // Cast role to valid UserRole type
        const roleValue = safeCast(role.role, validRoles, "viewer");
        
        const userRole: UserRoleWithStore = {
          id: role.id,
          user_id: role.user_id,
          role: roleValue,
          almacen_id: role.almacen_id,
          almacen_nombre: almacenNombre,
          created_at: role.created_at || new Date().toISOString()
        };
        
        userRolesMap.get(userId)?.push(userRole);
      });
    }
    
    // Map profiles to UserWithRoles objects
    const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
      const roles = userRolesMap.get(profile.id) || [];
      
      return {
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
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

    // Cast to a valid role
    const validRole = safeCast(role, validRoles, "viewer");

    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', validRole);
      
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
          role: validRole,
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
    
    // Get user roles with better join syntax
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*, profiles:profiles(*), almacenes:almacenes(*)')
      .eq('user_id', userId);
      
    if (rolesError) throw rolesError;
    
    // Ensure profile data is properly structured
    const profile = profileData ? {
      id: profileData.id,
      email: profileData.email || '',
      full_name: profileData.full_name || '',
      created_at: profileData.created_at
    } : null;
    
    // Process roles data - handle either array or single object response
    const roles: UserRoleWithStore[] = rolesData.map(role => {
      // Handle profiles data safely
      let email = '';
      let fullName = '';
      
      if (role.profiles) {
        // Check if it's an array or an object
        if (Array.isArray(role.profiles)) {
          if (role.profiles.length > 0) {
            email = role.profiles[0]?.email || '';
            fullName = role.profiles[0]?.full_name || '';
          }
        } else {
          email = (role.profiles as any).email || '';
          fullName = (role.profiles as any).full_name || '';
        }
      }
      
      // Handle almacenes data safely
      let almacenNombre = '';
      
      if (role.almacenes) {
        // Check if it's an array or an object
        if (Array.isArray(role.almacenes)) {
          if (role.almacenes.length > 0) {
            almacenNombre = role.almacenes[0]?.nombre || '';
          }
        } else {
          almacenNombre = (role.almacenes as any).nombre || '';
        }
      }

      // Cast role to valid UserRole type
      const roleValue = safeCast(role.role, validRoles, "viewer");
      
      // Return processed role
      return {
        id: role.id,
        user_id: role.user_id,
        role: roleValue,
        almacen_id: role.almacen_id,
        almacen_nombre: almacenNombre,
        created_at: role.created_at || new Date().toISOString()
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
