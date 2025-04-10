
import { UserRoleWithStore, UserRole } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Obtiene los roles de un usuario desde la base de datos
 */
export const fetchUserRoles = async (userId: string): Promise<UserRoleWithStore[]> => {
  try {
    console.log("AuthUtils: Fetching roles for user:", userId);
    
    // Check if we have a valid userId
    if (!userId) {
      console.error('AuthUtils: Invalid user ID provided');
      return [];
    }
    
    // Fetch user roles with JOIN to profiles and almacenes
    const { data, error } = await supabase
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
      .eq('user_id', userId);

    if (error) {
      console.error('AuthUtils: Error fetching user roles:', error);
      throw error;
    }

    console.log("AuthUtils: Fetched user roles data:", data);
    
    if (!data || data.length === 0) {
      console.log("AuthUtils: No roles found for user, checking if this is a first admin");
      
      // Try a direct connection check for new admin setup
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('AuthUtils: Error when checking profile:', profileError);
        // Don't throw here, try the RPC as a fallback
      }
      
      if (userProfile) {
        console.log("AuthUtils: Found user profile:", userProfile);
      }
      
      // Try using RPC to check if user should be admin
      try {
        console.log("AuthUtils: Checking admin status via RPC");
        const { data: isAdminResult, error: rpcError } = await supabase.rpc('is_admin');
        
        if (rpcError) {
          console.log("AuthUtils: RPC admin check error:", rpcError);
          // This is expected if the function doesn't exist, don't throw
        } else {
          console.log("AuthUtils: RPC admin check result:", isAdminResult);
          
          if (isAdminResult === true) {
            console.log("AuthUtils: User confirmed as admin via RPC");
            return [{
              id: 'virtual-admin-role',
              user_id: userId,
              role: 'admin' as UserRole,
              almacen_id: null,
              created_at: new Date().toISOString(),
              almacen_nombre: null
            }];
          }
        }
      } catch (rpcError) {
        console.log("AuthUtils: RPC admin check exception:", rpcError);
        // This is expected if the function doesn't exist, don't throw
      }
      
      return [];
    }

    // Transform the data to match our expected format
    const rolesWithStoreNames: UserRoleWithStore[] = data.map(role => ({
      id: role.id,
      user_id: role.user_id,
      role: role.role as UserRole,
      almacen_id: role.almacen_id,
      created_at: role.created_at,
      // Safe access to nested properties
      almacen_nombre: role.almacenes ? role.almacenes.nombre : null
    }));

    console.log("AuthUtils: Processed roles with store names:", rolesWithStoreNames);
    return rolesWithStoreNames;
  } catch (error) {
    console.error('AuthUtils: Error in fetchUserRoles:', error);
    // Return empty array instead of throwing to prevent blocking the authentication flow
    return [];
  }
};

/**
 * Verifica si un usuario tiene un rol específico
 */
export const checkHasRole = (
  userRoles: UserRoleWithStore[], 
  role: UserRole, 
  storeId?: string
): boolean => {
  console.log("AuthUtils: Checking role:", role, "for store:", storeId);
  console.log("AuthUtils: User has these roles:", userRoles);
  
  if (!userRoles || userRoles.length === 0) {
    console.log("AuthUtils: No roles found for user, denying access");
    return false;
  }
  
  // Verificación mejorada: Si el usuario tiene rol 'admin', siempre tiene acceso
  const isAdmin = userRoles.some(r => r.role === 'admin');
  if (isAdmin) {
    console.log("AuthUtils: User is admin, granting access");
    return true;
  }
  
  // Si se requiere un almacén específico, verificar que tenga el rol para ese almacén
  if (storeId) {
    const hasRoleForStore = userRoles.some(r => 
      r.role === role && r.almacen_id === storeId
    );
    console.log(`AuthUtils: User has role ${role} for store ${storeId}: ${hasRoleForStore}`);
    return hasRoleForStore;
  }
  
  // Si no se requiere un almacén específico, verificar que tenga el rol en general
  const hasRole = userRoles.some(r => r.role === role);
  console.log(`AuthUtils: User has role ${role}: ${hasRole}`);
  return hasRole;
};
