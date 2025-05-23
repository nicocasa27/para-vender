
import { useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { UserRole, UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles, checkHasRole } from '@/contexts/auth/auth-utils';

const MAX_ROLE_LOADING_RETRIES = 2; // Reducido de 3 a 2
const ROLE_LOADING_RETRY_DELAY = 500; // Reducido de 1000ms a 500ms

export function useRoles(user: User | null) {
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLoadingAttempt, setRoleLoadingAttempt] = useState(0);
  const pendingRoleLoadRef = useRef<Promise<UserRoleWithStore[]> | null>(null);
  const rolesCache = useRef<{ [userId: string]: UserRoleWithStore[] }>({});

  // Eliminamos el auto-refresh que estaba causando lentitud

  const loadUserRoles = useCallback(async (userId: string, forceRefresh = false): Promise<UserRoleWithStore[]> => {
    if (!userId) return [];
    
    console.log("Roles: Loading roles for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
    // Verificar cache primero si no es refresh forzado
    if (!forceRefresh && rolesCache.current[userId]) {
      console.log("Roles: Using cached roles");
      setUserRoles(rolesCache.current[userId]);
      return rolesCache.current[userId];
    }
    
    if (pendingRoleLoadRef.current && !forceRefresh) {
      console.log("Roles: Using existing pending role load request");
      return pendingRoleLoadRef.current;
    }
    
    setRolesLoading(true);
    
    const roleLoadPromise = (async () => {
      try {
        console.log("Roles: Starting role loading process");
        let roles: UserRoleWithStore[] = [];
        let attempt = 0;
        
        while (attempt < MAX_ROLE_LOADING_RETRIES) {
          attempt++;
          console.log(`Roles: Fetching roles attempt ${attempt}/${MAX_ROLE_LOADING_RETRIES}`);
          
          const fetchedRoles = await fetchUserRoles(userId);
          
          if (fetchedRoles.length > 0) {
            console.log(`Roles: Successfully fetched ${fetchedRoles.length} roles on attempt ${attempt}`);
            roles = fetchedRoles;
            // Guardar en cache
            rolesCache.current[userId] = roles;
            break;
          }
          
          if (attempt < MAX_ROLE_LOADING_RETRIES) {
            console.log(`Roles: No roles found on attempt ${attempt}, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, ROLE_LOADING_RETRY_DELAY));
          }
        }
        
        console.log("Roles: Loading process complete, setting userRoles state");
        setUserRoles(roles);
        setRoleLoadingAttempt(0);
        return roles;
      } catch (error) {
        console.error("Roles: Error during role loading:", error);
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
  }, []);

  const refreshUserRoles = useCallback(async (force = true): Promise<UserRoleWithStore[]> => {
    if (!user) {
      console.log("Roles: Can't refresh roles, no user logged in");
      return [];
    }
    
    console.log("Roles: Manually refreshing user roles for:", user.id, force ? "(forced)" : "");
    
    try {
      // Limpiar cache si es refresh forzado
      if (force) {
        delete rolesCache.current[user.id];
      }
      
      const roles = await loadUserRoles(user.id, force);
      
      if (roles.length === 0) {
        console.warn("Roles: No roles found after refresh");
      } else {
        console.log("Roles: Successfully refreshed roles:", roles);
      }
      
      return roles;
    } catch (error) {
      console.error("Roles: Error refreshing roles:", error);
      return [];
    }
  }, [user, loadUserRoles]);

  const hasRole = useCallback((role: UserRole, storeId?: string): boolean => {
    const result = checkHasRole(userRoles, role, storeId);
    console.log(`Roles: Checking if user has role '${role}'${storeId ? ` for store ${storeId}` : ''}: ${result}`, 
      `Current roles:`, userRoles);
    return result;
  }, [userRoles]);

  return {
    userRoles,
    rolesLoading,
    loadUserRoles,
    refreshUserRoles,
    hasRole
  };
}
