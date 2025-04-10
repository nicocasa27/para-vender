
import { UserRoleWithStore } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Obtiene los roles de un usuario desde Supabase
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  if (!userId) {
    console.log("Auth: fetchUserRoles called with no userId");
    return [];
  }
  
  try {
    console.log(`Auth: Fetching roles for user ${userId}`);

    // Intentamos primero usar la vista optimizada si existe
    let { data: rolesData, error: viewError } = await supabase
      .from('user_roles_with_name')
      .select('*')
      .eq('user_id', userId);

    // Si hay un error con la vista (por ejemplo, si no existe), usamos la tabla user_roles directamente
    if (viewError) {
      console.log("Auth: Error using user_roles_with_name view, falling back to user_roles table");
      
      // Obtenemos los roles con información de almacenes
      const { data: standardRolesData, error: rolesError } = await supabase
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

      if (rolesError) {
        throw rolesError;
      }
      
      rolesData = standardRolesData;
    }

    if (!rolesData || rolesData.length === 0) {
      console.log(`Auth: No roles found for user ${userId}`);
      
      // Si no hay roles, creamos un rol de viewer por defecto
      await createDefaultRole(userId);
      
      // Intentamos obtener los roles nuevamente después de crear el rol por defecto
      const { data: newRoles, error: newRolesError } = await supabase
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
        
      if (newRolesError) {
        throw newRolesError;
      }
      
      rolesData = newRoles || [];
    }

    console.log(`Auth: Found ${rolesData.length} roles for user ${userId}`);
    
    // Convertimos los datos de la base de datos al formato UserRoleWithStore
    const processedRoles: UserRoleWithStore[] = rolesData.map(role => {
      // Si estamos usando la vista, los campos son directos
      if ('almacen_nombre' in role) {
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as "admin" | "manager" | "sales" | "viewer",
          almacen_id: role.almacen_id,
          almacen_nombre: role.almacen_nombre,
          created_at: role.created_at
        };
      } 
      // Si estamos usando la tabla, hay que extraer los datos anidados
      else {
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as "admin" | "manager" | "sales" | "viewer",
          almacen_id: role.almacen_id,
          // Obtener el nombre del almacén del objeto anidado
          almacen_nombre: role.almacenes?.nombre || null,
          created_at: role.created_at
        };
      }
    });

    return processedRoles;
  } catch (error) {
    console.error("Auth: Error fetching user roles:", error);
    throw error;
  }
}

/**
 * Crea un rol por defecto para un usuario nuevo
 */
export async function createDefaultRole(userId: string): Promise<boolean> {
  if (!userId) {
    console.log("Auth: createDefaultRole called with no userId");
    return false;
  }
  
  try {
    console.log(`Auth: Creating default viewer role for user ${userId}`);
    
    // Verificar si ya existe un rol para este usuario
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Auth: Error checking for existing roles:", checkError);
      throw checkError;
    }
    
    // Solo crear un rol nuevo si no existe ninguno
    if (!existingRoles) {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'viewer',
          almacen_id: null
        });
        
      if (insertError) {
        console.error("Auth: Error creating default role:", insertError);
        throw insertError;
      }
      
      console.log(`Auth: Default viewer role created for user ${userId}`);
      return true;
    } else {
      console.log(`Auth: User ${userId} already has roles, skipping default role creation`);
      return false;
    }
  } catch (error) {
    console.error("Auth: Error creating default role:", error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function checkHasRole(
  userRoles: UserRoleWithStore[], 
  roleToCheck: "admin" | "manager" | "sales" | "viewer", 
  storeId?: string
): boolean {
  if (!userRoles || userRoles.length === 0) {
    console.log("Auth: checkHasRole called with no roles");
    return false;
  }

  // Si el usuario tiene el rol 'admin', tiene todos los permisos independientemente del almacén
  const isAdmin = userRoles.some(role => role.role === 'admin');
  if (isAdmin && roleToCheck !== 'admin') {
    console.log(`Auth: User is admin, automatically has ${roleToCheck} role`);
    return true;
  }

  // Gestión específica para cada tipo de rol
  if (roleToCheck === 'admin') {
    const hasAdminRole = userRoles.some(role => role.role === 'admin');
    console.log(`Auth: Checking if user has admin role: ${hasAdminRole}`);
    return hasAdminRole;
  }

  if (roleToCheck === 'manager') {
    // Si es para un almacén específico y pasamos storeId
    if (storeId) {
      const hasManagerRoleForStore = userRoles.some(
        role => role.role === 'manager' && role.almacen_id === storeId
      );
      console.log(`Auth: Checking if user has manager role for store ${storeId}: ${hasManagerRoleForStore}`);
      return hasManagerRoleForStore || isAdmin;
    }
    
    // Si no especificamos almacén, verificamos si tiene el rol en cualquier almacén
    const hasManagerRole = userRoles.some(role => role.role === 'manager');
    console.log(`Auth: Checking if user has any manager role: ${hasManagerRole}`);
    return hasManagerRole || isAdmin;
  }

  if (roleToCheck === 'sales') {
    // Si es para un almacén específico y pasamos storeId
    if (storeId) {
      const hasSalesRoleForStore = userRoles.some(
        role => (role.role === 'sales' || role.role === 'manager') && role.almacen_id === storeId
      );
      console.log(`Auth: Checking if user has sales role for store ${storeId}: ${hasSalesRoleForStore}`);
      return hasSalesRoleForStore || isAdmin;
    }
    
    // Si no especificamos almacén, verificamos si tiene el rol en cualquier almacén
    const hasSalesRole = userRoles.some(role => role.role === 'sales' || role.role === 'manager');
    console.log(`Auth: Checking if user has any sales role: ${hasSalesRole}`);
    return hasSalesRole || isAdmin;
  }

  if (roleToCheck === 'viewer') {
    // Todo usuario autenticado tiene al menos permisos de visor
    console.log("Auth: All authenticated users have viewer role");
    return true;
  }

  return false;
}
