
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sincroniza un usuario de Supabase Auth con las tablas de la aplicación
 */
export async function syncUserToTables(userId: string, email: string, fullName: string): Promise<boolean> {
  try {
    console.log("Sincronizando usuario:", { userId, email, fullName });
    
    // 1. Crear o actualizar perfil en la tabla profiles
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error("Error al verificar perfil:", profileCheckError);
      throw profileCheckError;
    }
    
    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName
        });
        
      if (profileError) {
        console.error("Error al crear perfil:", profileError);
        throw profileError;
      }
      console.log("Perfil creado exitosamente");
    } else {
      console.log("Perfil ya existe");
    }
    
    // 2. Verificar si ya tiene roles asignados
    const { data: existingRoles, error: rolesCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);
      
    if (rolesCheckError) {
      console.error("Error al verificar roles:", rolesCheckError);
      throw rolesCheckError;
    }
    
    // 3. Si no tiene roles, crear rol por defecto
    if (!existingRoles || existingRoles.length === 0) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'viewer',
          almacen_id: null
        });
        
      if (roleError) {
        console.error("Error al crear rol por defecto:", roleError);
        throw roleError;
      }
      console.log("Rol por defecto creado exitosamente");
    } else {
      console.log("Usuario ya tiene roles asignados");
    }
    
    return true;
  } catch (error: any) {
    console.error("Error en sincronización de usuario:", error);
    toast.error("Error al sincronizar usuario", {
      description: error.message
    });
    return false;
  }
}

/**
 * Verifica y repara usuarios que pueden estar mal sincronizados
 */
export async function repairUserSync(userId: string): Promise<boolean> {
  try {
    // Obtener información del usuario desde Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      throw new Error("No se pudo obtener información del usuario autenticado");
    }
    
    const email = user.email || "";
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     email.split('@')[0] || 
                     "Usuario";
    
    return await syncUserToTables(userId, email, fullName);
  } catch (error: any) {
    console.error("Error al reparar sincronización:", error);
    toast.error("Error al reparar usuario", {
      description: error.message
    });
    return false;
  }
}
