
import { UserRoleWithStore, UserRole } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

export const fetchUserRoles = async (userId: string): Promise<UserRoleWithStore[]> => {
  try {
    console.log("AuthUtils: Fetching roles for user:", userId);
    
    // First, attempt to fetch from the user_roles table directly
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        almacenes:almacen_id(nombre),
        created_at
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('AuthUtils: Error fetching user roles:', error);
      throw error;
    }

    console.log("AuthUtils: Fetched roles:", data);
    
    if (!data || data.length === 0) {
      console.log("AuthUtils: No roles found for user, checking if this is a first admin");
      
      // Try a direct connection check for new admin setup
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (profileError || !userProfile) {
        console.error('AuthUtils: Error or no profile found when checking admin status:', profileError);
        return [];
      }
      
      console.log("AuthUtils: Found user profile:", userProfile);
      
      // Special case for new project setup - this helps early admins
      // to access admin features even if the role is not yet assigned
      if (userProfile.email) {
        // Optional: Make a special RPC call to check if user should be admin
        try {
          const { data: isAdminResult } = await supabase.rpc('is_admin');
          console.log("AuthUtils: RPC admin check result:", isAdminResult);
          
          if (isAdminResult === true) {
            console.log("AuthUtils: User confirmed as admin via RPC");
            return [{
              id: 'virtual-admin-role',
              user_id: userId,
              role: 'admin' as UserRole,
              almacen_id: null,
              created_at: new Date().toISOString(),
            }];
          }
        } catch (rpcError) {
          console.log("AuthUtils: RPC admin check error (expected if function doesn't exist):", rpcError);
        }
      }
      
      return [];
    }

    const rolesWithStoreNames = data.map(role => ({
      ...role,
      almacen_nombre: role.almacenes?.nombre || null
    }));

    return rolesWithStoreNames;
  } catch (error) {
    console.error('AuthUtils: Error in fetchUserRoles:', error);
    return [];
  }
};

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
  
  // Admin can do anything
  const isAdmin = userRoles.some(r => r.role === 'admin');
  if (isAdmin) {
    console.log("AuthUtils: User is admin, granting access to all areas");
    return true;
  }
  
  // Manager can do anything except admin-specific tasks
  if (role !== 'admin' && userRoles.some(r => r.role === 'manager')) {
    console.log("AuthUtils: User is manager, granting access to non-admin role:", role);
    return true;
  }
  
  // For store-specific roles like sales
  if (storeId && userRoles.some(r => 
    r.role === role && r.almacen_id === storeId
  )) {
    console.log("AuthUtils: User has store-specific role for requested store, granting access");
    return true;
  }
  
  // For general roles without store specificity (like viewer)
  if (!storeId && userRoles.some(r => r.role === role)) {
    console.log("AuthUtils: User has general role, granting access");
    return true;
  }
  
  console.log("AuthUtils: User does not have required role, denying access");
  return false;
};
