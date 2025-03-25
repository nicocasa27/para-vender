
import { useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { UserRole, UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles, checkHasRole } from '@/contexts/auth/auth-utils';

const MAX_ROLE_LOADING_RETRIES = 3;
const ROLE_LOADING_RETRY_DELAY = 1000; // ms

export function useRoles(user: User | null) {
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLoadingAttempt, setRoleLoadingAttempt] = useState(0);
  const pendingRoleLoadRef = useRef<Promise<UserRoleWithStore[]> | null>(null);

  const loadUserRoles = useCallback(async (userId: string, forceRefresh = false): Promise<UserRoleWithStore[]> => {
    if (!userId) return [];
    
    console.log("Roles: Loading roles for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
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
    return await loadUserRoles(user.id, force);
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
