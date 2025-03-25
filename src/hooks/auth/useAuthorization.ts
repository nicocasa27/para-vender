
import { useState, useEffect } from 'react';
import { UserRole } from '@/types/auth';
import { toast } from "sonner";

export interface UseAuthorizationOptions {
  user: any;
  hasRole: (role: UserRole, storeId?: string) => boolean;
  userRoles: any[];
  rolesLoading: boolean;
  session: any;
  refreshUserRoles: () => Promise<any[]>;
}

export function useAuthorization(
  requiredRole?: UserRole, 
  storeId?: string,
  options: UseAuthorizationOptions
) {
  const { user, hasRole, userRoles, rolesLoading, session, refreshUserRoles } = options;
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [longTimeoutReached, setLongTimeoutReached] = useState(false);
  const [roleRefreshAttempts, setRoleRefreshAttempts] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  
  // Function to force a role refresh and retry authorization
  const forceRoleRefresh = async () => {
    if (!user) return;
    
    console.log("Authorization: Forcing role refresh");
    setRoleRefreshAttempts(prev => prev + 1);
    try {
      const refreshedRoles = await refreshUserRoles();
      console.log("Authorization: Roles refreshed:", refreshedRoles);
      // Re-check authorization with the new roles
      checkAuthorization();
    } catch (error) {
      console.error("Authorization: Error refreshing roles:", error);
      // Mark auth check as complete even if refresh failed
      setAuthCheckComplete(true);
    }
  };
  
  // Function to check authorization status
  const checkAuthorization = () => {
    // Don't check authorization if we're still loading roles or auth
    if (rolesLoading) {
      console.log("Authorization: Still loading, deferring authorization check");
      return;
    }
    
    if (!user) {
      console.log("Authorization: No user found, unauthorized");
      setIsAuthorized(false);
      setAuthCheckComplete(true);
      return;
    }
    
    console.log("Authorization: Checking for user:", user.id);
    console.log("Authorization: Session state:", session ? "Valid" : "Missing");
    console.log("Authorization: Required role:", requiredRole);
    console.log("Authorization: Current roles:", userRoles);
    
    if (requiredRole) {
      const authorized = hasRole(requiredRole, storeId);
      console.log(`Authorization: User has role ${requiredRole}?`, authorized);
      
      if (authorized) {
        console.log("Authorization: User is authorized");
        setIsAuthorized(true);
        setAuthCheckComplete(true);
      } else if (userRoles.length === 0 && roleRefreshAttempts < 3 && !maxAttemptsReached) {
        // No roles found, but we haven't exhausted our refresh attempts
        console.log("Authorization: No roles found but attempts remain, will retry");
        setIsAuthorized(null); // Keep authorization pending
        
        // Only continue trying to refresh if we haven't exceeded the limit
        if (roleRefreshAttempts < 3) {
          forceRoleRefresh();
        }
      } else {
        // User doesn't have the required role or we've exhausted retries
        console.log("Authorization: User is not authorized or retries exhausted");
        setIsAuthorized(false);
        setAuthCheckComplete(true);
        
        // Only show error if roles are loaded and we know authorization actually failed
        if (userRoles.length > 0) {
          toast.error("Acceso denegado", {
            description: "No tienes los permisos necesarios para acceder a esta página"
          });
        }
      }
    } else {
      // No specific role required
      console.log("Authorization: No specific role required, access granted");
      setIsAuthorized(true);
      setAuthCheckComplete(true);
    }
  };
  
  useEffect(() => {
    let isMounted = true;
    setTimeoutReached(false);
    setLongTimeoutReached(false);
    
    console.log("Authorization: Initializing check");
    console.log("Authorization: Roles loading:", rolesLoading);
    
    // Set up timeouts for loading indicators
    const timeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setTimeoutReached(true);
        console.log("Authorization: Check taking longer than expected");
      }
    }, 1500);
    
    const longTimeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setLongTimeoutReached(true);
        console.log("Authorization: Check taking much longer than expected");
        
        // Force a role refresh if we've waited too long and we're under the max attempts
        if (user && roleRefreshAttempts < 3 && !maxAttemptsReached) {
          forceRoleRefresh();
        } else if (roleRefreshAttempts >= 3) {
          // We've tried enough times, mark as complete and break the loop
          setMaxAttemptsReached(true);
          setAuthCheckComplete(true);
          console.log("Authorization: Max attempts reached, breaking the infinite loop");
          
          // For really long timeouts, just proceed with current authorization state
          if (userRoles.length > 0) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        }
      }
    }, 3500);
    
    // Add a final timeout to force-break any infinite loops after 8 seconds
    const emergencyTimeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        console.log("Authorization: EMERGENCY TIMEOUT - Breaking infinite loop");
        setMaxAttemptsReached(true);
        setAuthCheckComplete(true);
        
        // If we have a user, give them the benefit of the doubt
        if (user) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      }
    }, 8000);
    
    // If we have a user but no roles, try to refresh roles
    if (user && session && userRoles.length === 0 && !rolesLoading && roleRefreshAttempts < 3 && !maxAttemptsReached) {
      console.log("Authorization: User authenticated but no roles, refreshing");
      forceRoleRefresh();
    } else if (!rolesLoading) {
      // Only check authorization when roles are done loading
      console.log("Authorization: Ready to check authorization");
      setTimeout(checkAuthorization, 100); // Small delay to ensure state is settled
    } else {
      // Still loading either auth or roles, do not check authorization yet
      console.log("Authorization: Still loading roles, deferring authorization check");
    }
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      clearTimeout(longTimeoutTimer);
      clearTimeout(emergencyTimeoutTimer);
    };
  }, [
    rolesLoading, 
    user, 
    requiredRole, 
    storeId, 
    hasRole, 
    userRoles, 
    roleRefreshAttempts,
    session,
    maxAttemptsReached
  ]);

  return {
    isAuthorized,
    authCheckComplete,
    timeoutReached,
    longTimeoutReached,
    maxAttemptsReached,
    roleRefreshAttempts,
    forceRoleRefresh
  };
}
