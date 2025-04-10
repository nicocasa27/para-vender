
import { supabase } from "@/integrations/supabase/client";
import { UserRoleWithStore } from "@/types/auth";

/**
 * Obtiene los roles de un usuario desde la base de datos
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  try {
    console.log(`Fetching roles for user ${userId}`);
    const { data, error } = await supabase
      .from('user_roles_with_name')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`No roles found for user ${userId}`);
      return [];
    }

    console.log(`Found ${data.length} roles for user ${userId}:`, data);
    return data as UserRoleWithStore[];
  } catch (error) {
    console.error("Exception fetching user roles:", error);
    return [];
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function checkHasRole(
  userRoles: UserRoleWithStore[],
  role: string,
  storeId?: string
): boolean {
  // Si el usuario tiene el rol de administrador, tiene acceso a todo
  if (userRoles.some(r => r.role === 'admin')) {
    return true;
  }

  // Si se requiere un storeId específico, verificar para ese almacén
  if (storeId) {
    return userRoles.some(
      r => r.role === role && r.almacen_id === storeId
    );
  }

  // Verificar si tiene el rol asignado (sin importar el almacén)
  return userRoles.some(r => r.role === role);
}

/**
 * Crea un rol predeterminado 'viewer' para el usuario si no tiene ninguno
 */
export async function createDefaultRole(userId: string): Promise<boolean> {
  try {
    console.log(`Checking default role for user ${userId}`);
    
    // Verificar si ya tiene roles
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking existing roles:", checkError);
      return false;
    }
    
    // Si ya tiene roles, no crear uno nuevo
    if (existingRoles && existingRoles.length > 0) {
      console.log(`User ${userId} already has ${existingRoles.length} roles, skipping default role creation`);
      return true;
    }
    
    // Crear rol de visualizador por defecto
    console.log(`Creating default viewer role for user ${userId}`);
    const defaultRoleId = `default-viewer-${userId.substring(0, 8)}`;
    
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        id: defaultRoleId,
        user_id: userId,
        role: 'viewer',
        almacen_id: null // Rol global sin almacén específico
      });
      
    if (insertError) {
      console.error("Error creating default role:", insertError);
      return false;
    }
    
    console.log(`Default viewer role created successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Exception creating default role:", error);
    return false;
  }
}
