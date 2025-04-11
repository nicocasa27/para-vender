
import { supabase } from "@/integrations/supabase/client";
import { UserRole, UserRoleWithStore } from "@/types/auth";

/**
 * Verifica que el usuario tenga un rol por defecto y lo crea si no existe
 */
export async function createDefaultRole(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.error("createDefaultRole: No user ID provided");
      return false;
    }
    
    console.log(`createDefaultRole: Checking roles for user ${userId}`);
    
    // Verificar si el usuario ya tiene roles
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId);
      
    if (rolesError) {
      console.error("createDefaultRole: Error checking existing roles:", rolesError);
      throw rolesError;
    }
    
    // Si el usuario ya tiene roles, no hacemos nada
    if (existingRoles && existingRoles.length > 0) {
      console.log(`createDefaultRole: User ${userId} already has ${existingRoles.length} roles, no action needed`);
      return true;
    }
    
    // Crear perfil si no existe
    const { data: profileExists, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileCheckError) {
      console.error("createDefaultRole: Error checking profile:", profileCheckError);
    }
    
    if (!profileExists) {
      console.log(`createDefaultRole: Profile for user ${userId} does not exist, creating it`);
      
      // Obtener datos del usuario
      const { data: userData, error: userDataError } = await supabase.auth.getUser(userId);
      
      if (userDataError) {
        console.error("createDefaultRole: Error getting user data:", userDataError);
        
        // Intentemos obtener los datos básicos del usuario a través de la sesión actual
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        
        // Si estamos creando el rol para el usuario actual
        if (currentUser && currentUser.id === userId) {
          console.log("createDefaultRole: Using current user data to create profile");
          
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: currentUser.email,
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "Usuario sin nombre"
            });
            
          if (insertProfileError) {
            console.error("createDefaultRole: Error creating profile from session data:", insertProfileError);
            throw insertProfileError;
          }
        } else {
          // Si no podemos obtener los datos del usuario, creamos un perfil básico
          console.log("createDefaultRole: Creating basic profile without user data");
          
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: "Usuario sin nombre"
            });
            
          if (insertProfileError) {
            console.error("createDefaultRole: Error creating basic profile:", insertProfileError);
            throw insertProfileError;
          }
        }
      } else if (userData.user) {
        console.log("createDefaultRole: Creating profile with user data");
        
        const { error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userData.user.email,
            full_name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || "Usuario sin nombre"
          });
          
        if (insertProfileError) {
          console.error("createDefaultRole: Error creating profile from user data:", insertProfileError);
          throw insertProfileError;
        }
      }
    }
    
    // Crear rol por defecto
    console.log(`createDefaultRole: Creating default viewer role for user ${userId}`);
    
    const { error: insertRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'viewer' as UserRole,
        almacen_id: null
      });
      
    if (insertRoleError) {
      console.error("createDefaultRole: Error creating default role:", insertRoleError);
      throw insertRoleError;
    }
    
    console.log(`createDefaultRole: Successfully created default role for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error("createDefaultRole: Unhandled error:", error);
    
    // Intentar llamar a la función de sincronización como última opción
    try {
      console.log(`createDefaultRole: Attempting to use sync-users function as fallback for user ${userId}`);
      
      const { error: syncError } = await supabase.functions.invoke("sync-users", {
        body: { 
          forceUpdate: true,
          forceSyncAll: true,
          specificUserId: userId
        },
      });
      
      if (syncError) {
        console.error("createDefaultRole: Error calling sync-users function:", syncError);
        return false;
      }
      
      console.log("createDefaultRole: Successfully used sync-users as fallback");
      return true;
    } catch (syncErr) {
      console.error("createDefaultRole: Exception calling sync-users function:", syncErr);
      return false;
    }
  }
}

/**
 * Obtiene los roles de un usuario con información de sus almacenes asociados
 */
export async function fetchUserRoles(userId: string): Promise<UserRoleWithStore[]> {
  if (!userId) {
    console.error("fetchUserRoles: No user ID provided");
    return [];
  }
  
  console.log(`fetchUserRoles: Fetching roles for user ${userId}`);
  
  try {
    // Primero intentemos usar la vista optimizada que incluye nombres de almacenes
    let { data: viewRoles, error: viewError } = await supabase
      .from('user_roles_with_name')
      .select('*')
      .eq('user_id', userId);
      
    if (viewError) {
      console.error("fetchUserRoles: Error fetching from view:", viewError);
      
      // Si hay error con la vista, intentamos directamente con la tabla principal
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, almacenes(*)')
        .eq('user_id', userId);
        
      if (rolesError) {
        console.error("fetchUserRoles: Error fetching from table:", rolesError);
        throw rolesError;
      }
      
      console.log(`fetchUserRoles: Retrieved ${roles.length} roles from table`);
      
      // Mapear resultado a formato esperado
      const mappedRoles: UserRoleWithStore[] = roles.map(role => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        almacen_id: role.almacen_id,
        created_at: role.created_at,
        almacen_nombre: role.almacenes?.nombre || null
      }));
      
      return mappedRoles;
    }
    
    if (!viewRoles || viewRoles.length === 0) {
      console.log(`fetchUserRoles: No roles found for user ${userId}`);
      return [];
    }
    
    console.log(`fetchUserRoles: Retrieved ${viewRoles.length} roles from view`);
    
    // Mapear resultado de la vista a formato esperado
    const mappedRoles: UserRoleWithStore[] = viewRoles.map(role => ({
      id: role.id,
      user_id: role.user_id,
      role: role.role,
      almacen_id: role.almacen_id,
      created_at: role.created_at,
      almacen_nombre: role.almacen_nombre || null
    }));
    
    return mappedRoles;
  } catch (error) {
    console.error("fetchUserRoles: Error:", error);
    return [];
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function checkHasRole(
  userRoles: UserRoleWithStore[], 
  role: UserRole, 
  storeId?: string
): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  
  // Los administradores tienen acceso a todo
  if (userRoles.some(r => r.role === 'admin')) {
    return true;
  }
  
  // Para roles que requieren almacén específico
  if (role === 'sales' && storeId) {
    return userRoles.some(r => 
      r.role === role && r.almacen_id === storeId
    );
  }
  
  // Los managers tienen acceso a todo excepto funciones admin
  if (role !== 'admin' && userRoles.some(r => r.role === 'manager')) {
    return true;
  }
  
  // Verificación general de rol
  return userRoles.some(r => r.role === role);
}

