
import { UserRoleWithStore, UserRole } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

export const fetchUserRoles = async (userId: string): Promise<UserRoleWithStore[]> => {
  try {
    console.log("Fetching roles for user:", userId);
    
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
      console.error('Error fetching user roles:', error);
      return [];
    }

    console.log("Fetched roles:", data);
    const rolesWithStoreNames = data.map(role => ({
      ...role,
      almacen_nombre: role.almacenes?.nombre || null
    }));

    return rolesWithStoreNames;
  } catch (error) {
    console.error('Error in fetchUserRoles:', error);
    return [];
  }
};

export const checkHasRole = (
  userRoles: UserRoleWithStore[], 
  role: UserRole, 
  storeId?: string
): boolean => {
  console.log("Checking role:", role, "for store:", storeId);
  console.log("Current user roles:", userRoles);
  
  if (!userRoles || userRoles.length === 0) {
    console.log("No roles found for user, denying access");
    return false;
  }
  
  // Admin can do anything
  const isAdmin = userRoles.some(r => r.role === 'admin');
  if (isAdmin) {
    console.log("User is admin, granting access to all areas");
    return true;
  }
  
  // Manager can do anything except admin-specific tasks
  if (role !== 'admin' && userRoles.some(r => r.role === 'manager')) {
    console.log("User is manager, granting access to non-admin role:", role);
    return true;
  }
  
  // For store-specific roles like sales
  if (storeId && userRoles.some(r => 
    r.role === role && r.almacen_id === storeId
  )) {
    console.log("User has store-specific role for requested store, granting access");
    return true;
  }
  
  // For general roles without store specificity (like viewer)
  if (!storeId && userRoles.some(r => r.role === role)) {
    console.log("User has general role, granting access");
    return true;
  }
  
  console.log("User does not have required role, denying access");
  return false;
};
