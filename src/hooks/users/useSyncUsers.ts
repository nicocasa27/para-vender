
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
      
      // Primero, intentar una sincronización directa mediante operaciones en la base de datos
      if (specificUserId) {
        try {
          // 1. Verificar si el usuario existe en auth
          const { data: authData, error: authError } = await supabase.auth.getUser(specificUserId);
          
          if (authError) {
            console.error("Error verificando usuario en auth:", authError);
          } else if (authData.user) {
            console.log("Usuario encontrado en auth, sincronizando manualmente");
            
            // 2. Insertar/actualizar perfil
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: specificUserId,
                email: authData.user.email,
                full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || "Usuario"
              });
              
            if (profileError) {
              console.error("Error creando/actualizando perfil:", profileError);
            } else {
              console.log("Perfil creado/actualizado correctamente");
            }
            
            // 3. Verificar si ya tiene roles
            const { data: existingRoles, error: rolesError } = await supabase
              .from('user_roles')
              .select('id')
              .eq('user_id', specificUserId);
              
            if (rolesError) {
              console.error("Error verificando roles existentes:", rolesError);
            } else if (!existingRoles || existingRoles.length === 0) {
              // 4. Crear rol por defecto si no tiene
              const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: specificUserId,
                  role: 'viewer',
                  almacen_id: null
                });
                
              if (roleError) {
                console.error("Error creando rol por defecto:", roleError);
              } else {
                console.log("Rol por defecto creado correctamente");
              }
            } else {
              console.log(`Usuario ya tiene ${existingRoles.length} roles asignados`);
            }
          }
        } catch (directSyncError) {
          console.error("Error en sincronización directa:", directSyncError);
        }
      }
      
      // Llamar a la función edge como respaldo o para sincronización completa
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
