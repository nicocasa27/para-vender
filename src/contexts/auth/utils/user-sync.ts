
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sincroniza un usuario de Supabase Auth con las tablas de la aplicación
 * Versión simplificada que confía en el trigger automático
 */
export async function syncUserToTables(userId: string, email: string, fullName: string): Promise<boolean> {
  try {
    console.log("Sincronizando usuario:", { userId, email, fullName });
    
    // Verificar si el perfil ya existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error al verificar perfil:", profileError);
      throw profileError;
    }
    
    // Si no existe el perfil, crearlo manualmente
    if (!profile) {
      console.log("Creando perfil manualmente para usuario:", userId);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName
        });
        
      if (insertError) {
        console.error("Error al crear perfil:", insertError);
        throw insertError;
      }
      console.log("Perfil creado exitosamente");
    }
    
    // Verificar si ya tiene roles asignados
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);
      
    if (rolesError) {
      console.error("Error al verificar roles:", rolesError);
      throw rolesError;
    }
    
    // Si no tiene roles, crear rol por defecto
    if (!roles || roles.length === 0) {
      console.log("Creando rol por defecto para usuario:", userId);
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
    }
    
    console.log("Sincronización completada exitosamente");
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
 * Repara usuarios que pueden estar mal sincronizados
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
    
    console.log("Reparando sincronización para usuario:", { userId, email, fullName });
    
    const success = await syncUserToTables(userId, email, fullName);
    
    if (success) {
      toast.success("Usuario reparado exitosamente", {
        description: "Todos los datos están ahora sincronizados"
      });
    }
    
    return success;
  } catch (error: any) {
    console.error("Error al reparar sincronización:", error);
    toast.error("Error al reparar usuario", {
      description: error.message
    });
    return false;
  }
}
