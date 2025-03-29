
import { toast } from 'sonner';
import { UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles } from '@/contexts/auth/auth-utils';

const MAX_ROLE_LOADING_RETRIES = 3;
const ROLE_LOADING_RETRY_DELAY = 1000; // ms

/**
 * Hook para manejar la carga de roles de usuario
 */
export function useRoleLoader(
  setRolesLoading: (loading: boolean) => void,
  setUserRoles: (roles: UserRoleWithStore[]) => void,
  setRoleLoadingAttempt: (attempt: number) => void,
  pendingRoleLoadRef: React.MutableRefObject<Promise<UserRoleWithStore[]> | null>
) {
  /**
   * Carga los roles del usuario
   */
  const loadUserRoles = async (userId: string, forceRefresh = false): Promise<UserRoleWithStore[]> => {
    if (!userId) return [];
    
    console.log("Auth: Loading roles for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
    if (pendingRoleLoadRef.current && !forceRefresh) {
      console.log("Auth: Using existing pending role load request");
      return pendingRoleLoadRef.current;
    }
    
    setRolesLoading(true);
    
    const roleLoadPromise = (async () => {
      try {
        console.log("Auth: Starting role loading process");
        let roles: UserRoleWithStore[] = [];
        let attempt = 0;
        
        while (attempt < MAX_ROLE_LOADING_RETRIES) {
          attempt++;
          console.log(`Auth: Fetching roles attempt ${attempt}/${MAX_ROLE_LOADING_RETRIES}`);
          
          const fetchedRoles = await fetchUserRoles(userId);
          
          if (fetchedRoles.length > 0) {
            console.log(`Auth: Successfully fetched ${fetchedRoles.length} roles on attempt ${attempt}`);
            roles = fetchedRoles;
            break;
          }
          
          if (attempt < MAX_ROLE_LOADING_RETRIES) {
            console.log(`Auth: No roles found on attempt ${attempt}, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, ROLE_LOADING_RETRY_DELAY));
          }
        }
        
        console.log("Auth: Role loading process complete, setting userRoles state");
        setUserRoles(roles);
        setRoleLoadingAttempt(0);
        return roles;
      } catch (error) {
        console.error("Auth: Error during role loading:", error);
        setUserRoles([]);
        return [];
      } finally {
        setRolesLoading(false);
        if (pendingRoleLoadRef.current === roleLoadPromise) {
          pendingRoleLoadRef.current = null;
        }
      }
    })();
    
    pendingRoleLoadRef.current = roleLoadPromise;
    
    return roleLoadPromise;
  };

  /**
   * Actualiza manualmente los roles del usuario
   */
  const refreshUserRoles = async (user: User | null, force = true): Promise<UserRoleWithStore[]> => {
    if (!user) {
      console.log("Auth: Can't refresh roles, no user logged in");
      return [];
    }
    
    console.log("Auth: Manually refreshing user roles for:", user.id, force ? "(forced)" : "");
    
    try {
      const roles = await loadUserRoles(user.id, force);
      
      if (roles.length === 0) {
        console.warn("Auth: No roles found after refresh");
        // Solo mostrar toast si es un refresh manual (force=true)
        if (force) {
          toast.warning("No se encontraron roles", {
            description: "No tienes ningún rol asignado en el sistema"
          });
        }
      } else {
        console.log("Auth: Successfully refreshed roles:", roles);
        // Solo mostrar toast si es un refresh manual (force=true)
        if (force) {
          toast.success(`${roles.length} roles cargados correctamente`);
        }
      }
      
      return roles;
    } catch (error) {
      console.error("Auth: Error refreshing roles:", error);
      // Solo mostrar toast si es un refresh manual (force=true)
      if (force) {
        toast.error("Error al actualizar roles", {
          description: "Intenta nuevamente más tarde"
        });
      }
      return [];
    }
  };

  return {
    loadUserRoles,
    refreshUserRoles
  };
}
