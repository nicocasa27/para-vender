
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

/**
 * Hook para sincronizar usuarios entre auth y las tablas de perfiles/roles
 */
export function useSyncUsers() {
  const [syncing, setSyncing] = useState(false);
  const { session } = useAuth();

  /**
   * Sincroniza los usuarios de auth con las tablas de perfiles y roles
   */
  const syncUsers = async () => {
    try {
      if (!session?.access_token) {
        toast.error("No hay sesión activa", {
          description: "Debes iniciar sesión para sincronizar usuarios"
        });
        return 0;
      }

      setSyncing(true);
      toast.info("Iniciando sincronización de usuarios...");
      
      // Método 1: Usando edge function (preferido)
      try {
        const { data, error } = await supabase.functions.invoke("sync-users", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (error) {
          console.error("Error llamando a la función sync-users:", error);
          throw error;
        }

        console.log("Resultado de sincronización:", data);
        
        // Reportar resultados
        if (data.created > 0) {
          toast.success(`Se han creado ${data.created} perfiles de usuarios`, {
            description: "Los usuarios ahora aparecerán en la lista"
          });
        }
        
        if (data.missingAuth > 0) {
          toast.warning(`Se detectaron ${data.missingAuth} perfiles sin usuario en Auth`, {
            description: "Estos perfiles podrían necesitar ser eliminados"
          });
        }
        
        if (data.created === 0 && data.missingAuth === 0) {
          toast.success("Usuarios sincronizados correctamente", {
            description: "No se requirieron cambios"
          });
        }
        
        return data.created;
      } catch (edgeFunctionError) {
        console.error("Error usando edge function para sincronización:", edgeFunctionError);
        console.log("Recurriendo a método alternativo de sincronización");
        
        // Método 2: Sincronización manual (fallback)
        return await manualSyncUsers();
      }
    } catch (error: any) {
      console.error("Error al sincronizar usuarios:", error);
      toast.error("Error al sincronizar usuarios", {
        description: error.message
      });
      return 0;
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Método alternativo de sincronización (usado como fallback)
   */
  const manualSyncUsers = async (): Promise<number> => {
    try {
      console.log("Iniciando sincronización manual de usuarios");
      
      // 1. Obtener todos los usuarios que tienen un perfil
      const { data: profileUsers, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name');
        
      if (profileError) {
        console.error("Error al obtener perfiles:", profileError);
        throw profileError;
      }
      
      // 2. Obtener todos los usuarios que tienen roles
      const { data: roleUsers, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id');
        
      if (roleError) {
        console.error("Error al obtener roles:", roleError);
        throw roleError;
      }
      
      // Crear mapas para búsqueda rápida
      const profileMap = new Map();
      profileUsers?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      const roleMap = new Map();
      roleUsers?.forEach(role => {
        roleMap.set(role.user_id, true);
      });
      
      console.log(`Encontrados ${profileUsers?.length || 0} perfiles y ${roleUsers?.length || 0} usuarios con roles`);
      
      // 3. Encontrar usuarios que tienen perfil pero no tienen rol
      const usersWithoutRoles = profileUsers?.filter(profile => !roleMap.has(profile.id)) || [];
      
      console.log(`Se encontraron ${usersWithoutRoles.length} usuarios sin roles`);
      
      // 4. Crear roles por defecto para estos usuarios
      let createdRoles = 0;
      
      for (const user of usersWithoutRoles) {
        // Crear rol viewer por defecto
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'viewer',
            almacen_id: null
          });
          
        if (roleError) {
          console.error(`Error al crear rol para ${user.email}:`, roleError);
          continue;
        }
        
        createdRoles++;
      }
      
      // 5. Verificar usuarios con roles pero sin perfil (esto no debería suceder normalmente)
      const rolesWithoutProfile = [];
      
      for (const role of roleUsers || []) {
        if (!profileMap.has(role.user_id)) {
          rolesWithoutProfile.push(role.user_id);
        }
      }
      
      console.log(`Se encontraron ${rolesWithoutProfile.length} roles sin perfil asociado`);
      
      // Reportar resultados
      if (createdRoles > 0) {
        toast.success(`Se han creado ${createdRoles} roles para usuarios`, {
          description: "Los usuarios ahora tendrán roles asignados"
        });
      }
      
      if (rolesWithoutProfile.length > 0) {
        toast.warning(`Se detectaron ${rolesWithoutProfile.length} roles sin perfil asociado`, {
          description: "Esto podría indicar inconsistencias en la base de datos"
        });
      }
      
      if (createdRoles === 0 && rolesWithoutProfile.length === 0) {
        toast.success("Usuarios sincronizados correctamente", {
          description: "No se requirieron cambios"
        });
      }
      
      return createdRoles;
    } catch (error: any) {
      console.error("Error en sincronización manual:", error);
      toast.error("Error en sincronización manual", {
        description: error.message
      });
      return 0;
    }
  };

  return {
    syncUsers,
    syncing
  };
}
