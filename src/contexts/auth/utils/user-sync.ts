
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
      console.log("Creando nuevo perfil para usuario:", userId);
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
      console.log("Perfil ya existe, actualizando si es necesario");
      // Actualizar perfil existente con los datos más recientes
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: email,
          full_name: fullName
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error("Error al actualizar perfil:", updateError);
        throw updateError;
      }
      console.log("Perfil actualizado exitosamente");
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
    } else {
      console.log("Usuario ya tiene roles asignados:", existingRoles.length);
    }
    
    // 4. Verificar que todo se creó correctamente
    const { data: finalProfile, error: finalProfileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();
      
    if (finalProfileError || !finalProfile) {
      console.error("Error en verificación final del perfil:", finalProfileError);
      throw new Error("No se pudo verificar que el perfil se creó correctamente");
    }
    
    const { data: finalRoles, error: finalRolesError } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId);
      
    if (finalRolesError || !finalRoles || finalRoles.length === 0) {
      console.error("Error en verificación final de roles:", finalRolesError);
      throw new Error("No se pudo verificar que los roles se crearon correctamente");
    }
    
    console.log("Sincronización completada exitosamente:", {
      profile: finalProfile,
      roles: finalRoles
    });
    
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
    
    console.log("Reparando sincronización para usuario:", { userId, email, fullName });
    
    // Hacer una limpieza previa para asegurar que todo esté correcto
    // Esto elimina roles duplicados si existieran
    try {
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId);
        
      if (existingRoles && existingRoles.length > 1) {
        console.log("Eliminando roles duplicados antes de reparar");
        // Mantener solo el primer rol y eliminar los demás
        const keepRoleId = existingRoles[0].id;
        
        for (let i = 1; i < existingRoles.length; i++) {
          await supabase
            .from('user_roles')
            .delete()
            .eq('id', existingRoles[i].id);
        }
        
        console.log(`Se conservó el rol ${keepRoleId} y se eliminaron ${existingRoles.length - 1} roles duplicados`);
      }
    } catch (cleanupError) {
      console.error("Error en limpieza previa:", cleanupError);
      // Continuar con la reparación a pesar del error en la limpieza
    }
    
    const success = await syncUserToTables(userId, email, fullName);
    
    if (success) {
      toast.success("Usuario reparado exitosamente", {
        description: "Todos los datos están ahora sincronizados"
      });
      
      // Intentar también llamar a la función edge para asegurar sincronización completa
      try {
        const { data: syncData, error: syncError } = await supabase.functions.invoke("sync-users", {
          body: { 
            forceUpdate: true,
            forceSyncAll: false,
            specificUserId: userId
          },
        });
        
        if (syncError) {
          console.warn("Error en función edge sync-users:", syncError);
        } else {
          console.log("Función edge sync-users ejecutada:", syncData);
        }
      } catch (edgeFunctionError) {
        console.warn("No se pudo ejecutar función edge:", edgeFunctionError);
      }
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
