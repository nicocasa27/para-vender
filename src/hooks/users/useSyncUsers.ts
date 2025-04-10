
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
      setSyncing(true);
      toast.info("Iniciando sincronización de usuarios...");
      
      console.log("Calling sync-users edge function");
      
      // Llamar a la función sync-users (ahora sin requerir autenticación)
      const { data, error } = await supabase.functions.invoke("sync-users", {
        body: { forceUpdate: true }, // Agregar opción para forzar actualización de todos los usuarios
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

  // Método alternativo si edge function falla (no implementado por ahora)
  const manualSyncUsers = async (): Promise<number> => {
    // Implementación de fallback mantenida como referencia
    console.log("Fallback synchronization not needed anymore");
    return 0;
  };

  return {
    syncUsers,
    syncing
  };
}
