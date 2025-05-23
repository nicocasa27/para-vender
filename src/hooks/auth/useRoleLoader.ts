
import { User } from '@supabase/supabase-js';
import { UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles } from '@/contexts/auth/auth-utils';

interface UseRoleLoaderParams {
  setRolesLoading: (loading: boolean) => void;
  setUserRoles: (roles: UserRoleWithStore[]) => void;
  setRoleLoadingAttempt: (attempt: number) => void;
  pendingRoleLoadRef: React.MutableRefObject<Promise<UserRoleWithStore[]> | null>;
}

/**
 * Hook optimizado para cargar los roles de usuario
 */
export function useRoleLoader({
  setRolesLoading,
  setUserRoles,
  setRoleLoadingAttempt,
  pendingRoleLoadRef
}: UseRoleLoaderParams) {
  const MAX_ROLE_LOADING_RETRIES = 2; // Reducido de 3 a 2
  const ROLE_LOADING_RETRY_DELAY = 500; // Reducido de 1000ms a 500ms

  /**
   * Carga los roles de un usuario con cache optimizado
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
   * Actualiza los roles de un usuario de forma optimizada
   */
  const refreshUserRoles = async (user: User | null, force = true): Promise<UserRoleWithStore[]> => {
    if (!user) {
      console.log("Auth: Can't refresh roles, no user logged in");
      return [];
    }
    
    console.log("Auth: Refreshing user roles for:", user.id, force ? "(forced)" : "");
    return await loadUserRoles(user.id, force);
  };

  return { loadUserRoles, refreshUserRoles };
}
