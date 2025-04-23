import { supabase } from '@/integrations/supabase/client';
import { UserRoleWithStore, UserRole } from '@/types/auth';

/**
 * Obtiene los roles de un usuario desde Supabase
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  try {
    console.log("Auth Utils: Fetching roles for user:", userId);

    // Obtener roles con información del almacén
    const { data, error } = await supabase
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
      .eq('user_id', userId);

    if (error) {
      console.error("Auth Utils: Error fetching user roles:", error);
      throw error;
    }

    // Refactor: Tipado seguro para almacenes
    const roles = data.map(role => {
      let almacenNombre: string | null = null;
      let almacenesObject: { nombre: string } = { nombre: '' };

      const almacenesField = role.almacenes as { nombre: string } | { nombre: string }[] | null | undefined;

      if (almacenesField) {
        if (Array.isArray(almacenesField) && almacenesField.length > 0) {
          almacenNombre = almacenesField[0]?.nombre || null;
          almacenesObject = almacenNombre ? { nombre: almacenNombre } : { nombre: '' };
        } else if (!Array.isArray(almacenesField) && typeof almacenesField === 'object' && 'nombre' in almacenesField) {
          almacenNombre = almacenesField.nombre || null;
          almacenesObject = almacenNombre ? { nombre: almacenNombre } : { nombre: '' };
        }
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
    });

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
    
    // Si se requiere un almacén específico
    if (storeId) {
      return userRoles.some(r => 
        r.role === role && 
        (r.almacen_id === storeId || r.role === 'admin')
      );
    }
    
    // Si solo se requiere un rol sin almacén específico
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
    
    // Verificar si el usuario ya tiene roles
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Auth Utils: Error al verificar roles existentes:", checkError);
      return false;
    }
    
    // Si ya tiene roles, no crear uno nuevo
    if (existingRoles && existingRoles.length > 0) {
      console.log("Auth Utils: El usuario ya tiene roles asignados, no se crea uno por defecto");
      return true;
    }
    
    console.log("Auth Utils: Creando rol por defecto para usuario:", userId);
    
    // Crear rol por defecto (viewer)
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

    // Obtener usuarios con sus perfiles
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

    // Refactor: Tipado seguro para almacenes en los roles
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

        // Refactor: Tipado seguro para almacenes
        const transformedRoles = roles.map(role => {
          let almacenNombre: string | null = null;
          let almacenesObject: { nombre: string } = { nombre: '' };

          const almacenesField = role.almacenes as { nombre: string } | { nombre: string }[] | null | undefined;

          if (almacenesField) {
            if (Array.isArray(almacenesField) && almacenesField.length > 0) {
              almacenNombre = almacenesField[0]?.nombre || null;
              almacenesObject = almacenNombre ? { nombre: almacenNombre } : { nombre: '' };
            } else if (!Array.isArray(almacenesField) && typeof almacenesField === 'object' && 'nombre' in almacenesField) {
              almacenNombre = almacenesField.nombre || null;
              almacenesObject = almacenNombre ? { nombre: almacenNombre } : { nombre: '' };
            }
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
        });

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
