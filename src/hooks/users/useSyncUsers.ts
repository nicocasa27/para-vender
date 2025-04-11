
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
      toast.info("Iniciando sincronización completa de usuarios...");
      
      console.log("Calling sync-users edge function with forceUpdate=true");
      
      // Siempre llamar con forceUpdate=true para garantizar que todos los usuarios se sincronicen
      const { data, error } = await supabase.functions.invoke("sync-users", {
        body: { 
          forceUpdate: true,
          forceSyncAll: true // Agregamos este parámetro para sincronizar todos los usuarios
        },
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

  return {
    syncUsers,
    syncing
  };
}
