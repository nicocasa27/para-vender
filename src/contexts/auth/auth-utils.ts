
import { supabase } from '@/integrations/supabase/client';
import { UserRoleWithStore, UserRole } from '@/types/auth';

/**
 * Función auxiliar para mapear los roles con tipado y consistencia
 */
function mapRoleData(role: any): UserRoleWithStore {
  let almacenNombre: string | null = null;
  let almacenesObject: { nombre: string } = { nombre: '' };

  // Manejar diferentes formatos de datos para almacenes
  if (role.almacenes) {
    if (Array.isArray(role.almacenes) && role.almacenes.length > 0) {
      // Si es un array, tomar el primer elemento
      almacenNombre = role.almacenes[0]?.nombre || null;
    } else if (typeof role.almacenes === 'object' && role.almacenes !== null) {
      // Si es un objeto directo
      almacenNombre = role.almacenes.nombre || null;
    }
  }

  // Construir el objeto almacenes con el formato esperado
  if (almacenNombre) {
    almacenesObject = { nombre: almacenNombre };
  }

  return {
    id: role.id,
    user_id: role.user_id,
    role: role.role,
    almacen_id: role.almacen_id,
    created_at: role.created_at,
    almacen_nombre: almacenNombre,
    almacenes: almacenesObject
  };
}

/**
 * Obtiene los roles de un usuario desde Supabase
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  try {
    console.log("Auth Utils: Fetching roles for user:", userId);

    // Usar función de RPC para verificar si el usuario es admin, evitando recursión infinita
    const { data: isAdminCheck, error: adminError } = await supabase.rpc('user_has_role', {
      role_name: 'admin'
    });

    // Si es admin, puede ver todos los roles (evitamos recursión)
    const isAdmin = isAdminCheck === true;
    console.log("Auth Utils: User is admin?", isAdmin);

    let query = supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        almacenes:almacen_id (
          nombre
        )
      `);

    // Si no es admin, filtrar sólo por los roles del usuario actual
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Auth Utils: Error fetching user roles:", error);
      throw error;
    }

    const roles = data.map(mapRoleData);

    console.log("Auth Utils: Fetched roles:", roles);
    return roles;
  } catch (error) {
    console.error("Auth Utils: Error in fetchUserRoles:", error);
    return [];
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function checkHasRole(userRoles: UserRoleWithStore[], role: UserRole, storeId?: string): boolean {
  try {
    // Los administradores tienen acceso a todo
    const isAdmin = userRoles.some(r => r.role === 'admin');
    if (isAdmin) return true;

    if (storeId) {
      return userRoles.some(r =>
        r.role === role &&
        (r.almacen_id === storeId || r.role === 'admin')
      );
    }

    return userRoles.some(r => r.role === role);
  } catch (error) {
    console.error("Auth Utils: Error en checkHasRole:", error);
    return false;
  }
}

/**
 * Crea un rol por defecto para un usuario si no tiene ninguno
 */
export async function createDefaultRole(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.error("Auth Utils: No se proporcionó userId para createDefaultRole");
      return false;
    }

    console.log("Auth Utils: Verificando si el usuario necesita un rol por defecto:", userId);

    // Usamos la función RPC para verificar roles para evitar recursión
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);

    if (checkError) {
      console.error("Auth Utils: Error al verificar roles existentes:", checkError);
      return false;
    }

    if (existingRoles && existingRoles.length > 0) {
      console.log("Auth Utils: El usuario ya tiene roles asignados, no se crea uno por defecto");
      return true;
    }

    console.log("Auth Utils: Creando rol por defecto para usuario:", userId);

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'viewer',
        almacen_id: null
      });

    if (insertError) {
      console.error("Auth Utils: Error al crear rol por defecto:", insertError);
      return false;
    }

    console.log("Auth Utils: Rol por defecto creado correctamente");
    return true;
  } catch (error) {
    console.error("Auth Utils: Error en createDefaultRole:", error);
    return false;
  }
}

/**
 * Obtiene todos los usuarios con sus roles
 */
export async function fetchAllUsers() {
  try {
    console.log("Auth Utils: Obteniendo todos los usuarios");

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at
      `);

    if (error) {
      console.error("Auth Utils: Error fetching users:", error);
      throw error;
    }

    const usersWithRoles = await Promise.all(
      data.map(async (user) => {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            id,
            user_id,
            role,
            almacen_id,
            created_at,
            almacenes:almacen_id (
              nombre
            )
          `)
          .eq('user_id', user.id);

        if (rolesError) {
          console.error(`Auth Utils: Error fetching roles for user ${user.id}:`, rolesError);
          return { ...user, roles: [] };
        }

        const transformedRoles = roles.map(mapRoleData);

        return {
          ...user,
          roles: transformedRoles
        };
      })
    );

    console.log("Auth Utils: Fetched all users with roles:", usersWithRoles);
    return usersWithRoles;
  } catch (error) {
    console.error("Auth Utils: Error in fetchAllUsers:", error);
    throw error;
  }
}
