
import { supabase } from "@/integrations/supabase/client";
import { UserRoleWithStore, UserRole } from "@/types/auth";

/**
 * Obtiene los roles de un usuario
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  if (!userId) return [];
  
  try {
    console.log("Fetching roles for user:", userId);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        almacenes (
          nombre
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      throw error;
    }

    const roles: UserRoleWithStore[] = (data || []).map(role => ({
      id: role.id,
      user_id: role.user_id,
      role: role.role as any,
      almacen_id: role.almacen_id,
      created_at: role.created_at,
      almacen_nombre: role.almacenes?.nombre || null
    }));

    console.log("Fetched roles:", roles);
    return roles;
  } catch (error) {
    console.error("Error in fetchUserRoles:", error);
    return [];
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function checkHasRole(userRoles: UserRoleWithStore[], role: UserRole, storeId?: string): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Si es admin, tiene acceso a todo
  if (userRoles.some(r => r.role === 'admin')) {
    return true;
  }

  // Verificar el rol específico
  return userRoles.some(userRole => {
    const hasRole = userRole.role === role;
    
    if (!storeId) {
      return hasRole;
    }
    
    // Si se especifica una tienda, verificar que coincida
    return hasRole && (userRole.almacen_id === storeId || userRole.almacen_id === null);
  });
}

/**
 * Crea un rol por defecto para un usuario
 */
export async function createDefaultRole(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    console.log("Creating default role for user:", userId);
    
    // Verificar si ya tiene roles
    const existingRoles = await fetchUserRoles(userId);
    if (existingRoles.length > 0) {
      console.log("User already has roles, skipping default role creation");
      return;
    }
    
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'viewer',
        almacen_id: null
      });

    if (error) {
      console.error("Error creating default role:", error);
      throw error;
    }
    
    console.log("Default role created successfully");
  } catch (error) {
    console.error("Error in createDefaultRole:", error);
  }
}
