
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
  const syncUsers = async (specificUserId?: string) => {
    try {
      setSyncing(true);
      
      if (specificUserId) {
        toast.info(`Sincronizando usuario específico (${specificUserId})...`);
        console.log(`Calling sync-users edge function for user ${specificUserId}`);
      } else {
        toast.info("Iniciando sincronización completa de usuarios...");
        console.log("Calling sync-users edge function with forceUpdate=true");
      }
      
      // Parámetros para la sincronización
      const params = { 
        forceUpdate: true,
        forceSyncAll: !specificUserId, // Solo forzar todos si no hay usuario específico
        specificUserId: specificUserId || null
      };
      
      // Llamar a la función edge
      const { data, error } = await supabase.functions.invoke("sync-users", {
        body: params,
      });

      if (error) {
        console.error("Error llamando a la función sync-users:", error);
        throw error;
      }

      console.log("Resultado de sincronización:", data);
      
      // Reportar resultados detallados
      if (data.created_profiles > 0) {
        toast.success(`Se han creado ${data.created_profiles} perfiles de usuarios`, {
          description: "Los usuarios ahora aparecerán en la lista"
        });
        
        // Mostrar detalles de los perfiles creados
        if (data.created_profile_details && data.created_profile_details.length > 0) {
          console.log("Perfiles creados:", data.created_profile_details);
          
          // Mostrar nombres de usuarios creados en el toast
          const userNames = data.created_profile_details.map(p => p.email || p.full_name).join(", ");
          toast.success(`Usuarios creados: ${userNames}`, {
            duration: 5000
          });
        }
      }
      
      if (data.created_roles > 0) {
        toast.success(`Se han creado ${data.created_roles} roles de usuarios`, {
          description: "Los usuarios ahora tienen roles asignados"
        });
      }
      
      if (data.updated_profiles > 0) {
        toast.success(`Se han actualizado ${data.updated_profiles} perfiles existentes`, {
          description: "Perfiles existentes han sido actualizados"
        });
      }
      
      if (data.orphaned_profiles > 0) {
        toast.warning(`Se detectaron ${data.orphaned_profiles} perfiles sin usuario en Auth`, {
          description: "Estos perfiles podrían necesitar ser eliminados"
        });
        
        // Mostrar detalles de los perfiles huérfanos
        if (data.orphaned_profile_details && data.orphaned_profile_details.length > 0) {
          console.log("Perfiles huérfanos:", data.orphaned_profile_details);
        }
      }
      
      if (data.created_profiles === 0 && data.created_roles === 0 && 
          data.updated_profiles === 0 && data.orphaned_profiles === 0) {
        toast.success("Usuarios sincronizados correctamente", {
          description: "No se requirieron cambios"
        });
      }
      
      if (data.specific_user_processed) {
        toast.success(`Usuario ${data.specific_user_processed} sincronizado correctamente`);
      }
      
      // Verificar si hay usuarios en la base de datos que no estén en Supabase Auth
      if (data.orphaned_profiles > 0 && data.orphaned_profile_details) {
        // Eliminar perfiles huérfanos si se solicita
        const orphanedIds = data.orphaned_profile_details.map((p: any) => p.id);
        
        console.log("Perfiles huérfanos que podrían ser eliminados:", orphanedIds);
        toast.warning(`Se detectaron ${orphanedIds.length} perfiles huérfanos`, {
          description: "Estos perfiles no existen en Supabase Auth"
        });
      }
      
      return data;
    } catch (error: any) {
      console.error("Error al sincronizar usuarios:", error);
      toast.error("Error al sincronizar usuarios", {
        description: error.message || "Intenta nuevamente en unos momentos"
      });
      return null;
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Elimina usuarios huérfanos que no existen en Supabase Auth
   */
  const cleanupOrphanedUsers = async () => {
    try {
      setSyncing(true);
      toast.info("Iniciando limpieza de usuarios huérfanos...");
      
      // Primero obtener todos los perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');
        
      if (profilesError) {
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        toast.info("No hay perfiles para verificar");
        return;
      }
      
      console.log(`Verificando ${profiles.length} perfiles contra Supabase Auth...`);
      
      // Llamar a la función de sincronización con un parámetro especial para limpieza
      const { data, error } = await supabase.functions.invoke("sync-users", {
        body: { 
          forceUpdate: true,
          forceSyncAll: true,
          cleanupOrphaned: true
        },
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Resultado de limpieza:", data);
      
      if (data.removed_orphans && data.removed_orphans > 0) {
        toast.success(`Se eliminaron ${data.removed_orphans} perfiles huérfanos`, {
          description: "Los perfiles sin usuario en Auth han sido eliminados"
        });
      } else {
        toast.success("No se encontraron perfiles huérfanos para eliminar");
      }
      
      return data;
    } catch (error: any) {
      console.error("Error al limpiar usuarios huérfanos:", error);
      toast.error("Error al limpiar usuarios", {
        description: error.message || "Intenta nuevamente en unos momentos"
      });
      return null;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncUsers,
    cleanupOrphanedUsers,
    syncing
  };
}
