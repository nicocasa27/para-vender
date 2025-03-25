
import { UserRoleWithStore, UserRole } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

export const fetchUserRoles = async (userId: string): Promise<UserRoleWithStore[]> => {
  try {
    console.log("AuthUtils: Fetching roles for user:", userId);
    
    // Check if we have a valid userId
    if (!userId) {
      console.error('AuthUtils: Invalid user ID provided');
      return [];
    }
    
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

    console.log("AuthUtils: Fetched roles data:", data);
    
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
            }];
          }
        }
      } catch (rpcError) {
        console.log("AuthUtils: RPC admin check exception:", rpcError);
        // This is expected if the function doesn't exist, don't throw
      }
      
      return [];
    }

    const rolesWithStoreNames = data.map(role => ({
      ...role,
      almacen_nombre: role.almacenes?.nombre || null
    }));

    console.log("AuthUtils: Processed roles with store names:", rolesWithStoreNames);
    return rolesWithStoreNames;
  } catch (error) {
    console.error('AuthUtils: Error in fetchUserRoles:', error);
    // Return empty array instead of throwing to prevent blocking the authentication flow
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
