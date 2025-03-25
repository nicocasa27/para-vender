
import { useEffect } from 'react';
import { UserRole } from '@/types/auth';
import { toast } from "sonner";
import { useAuthorizationCheck } from './useAuthorizationCheck';
import { useAuthorizationTimeout } from './useAuthorizationTimeout';
import { useRoleRefresh } from './useRoleRefresh';
import { useEmergencyTimeout } from './useEmergencyTimeout';

export interface UseAuthorizationOptions {
  user: any;
  hasRole: (role: UserRole, storeId?: string) => boolean;
  userRoles: any[];
  rolesLoading: boolean;
  session: any;
  refreshUserRoles: () => Promise<any[]>;
}

export function useAuthorization(
  requiredRole: UserRole | undefined, 
  options: UseAuthorizationOptions,
  storeId?: string
) {
  const { user, hasRole, userRoles, rolesLoading, session, refreshUserRoles } = options;
  
  // Usamos los hooks más pequeños que hemos creado
  const {
    isAuthorized,
    authCheckComplete,
    checkAuthorization,
    setEmergencyAuthorization
  } = useAuthorizationCheck({
    user,
    hasRole,
    requiredRole,
    storeId
  });
  
  const {
    timeoutReached,
    longTimeoutReached,
    setupTimeouts
  } = useAuthorizationTimeout(authCheckComplete);
  
  const {
    roleRefreshAttempts,
    maxAttemptsReached,
    forceRoleRefresh,
    MAX_ROLE_REFRESH_ATTEMPTS
  } = useRoleRefresh({
    refreshRoles: refreshUserRoles,
    user,
    checkAuthorization
  });
  
  // Configurar el timeout de emergencia
  useEmergencyTimeout({
    user,
    authCheckComplete,
    setEmergencyAuthorization
  });
  
  // Efecto principal que coordina la autorización
  useEffect(() => {
    console.log("Authorization: Initializing check");
    console.log("Authorization: Roles loading:", rolesLoading);
    console.log("Authorization: Required role:", requiredRole);
    
    // Configurar timeouts
    const { cleanup } = setupTimeouts();
    
    // Lógica para verificar la autorización o refrescar roles si es necesario
    if (user && session && userRoles.length === 0 && !rolesLoading && roleRefreshAttempts < MAX_ROLE_REFRESH_ATTEMPTS && !maxAttemptsReached) {
      console.log("Authorization: User authenticated but no roles, refreshing");
      forceRoleRefresh();
    } else if (!rolesLoading) {
      // Solo verificar la autorización cuando los roles hayan terminado de cargar
      console.log("Authorization: Ready to check authorization");
      setTimeout(checkAuthorization, 100); // Pequeño retraso para asegurar que el estado esté estable
    } else {
      // Aún cargando roles o auth, no verificar autorización todavía
      console.log("Authorization: Still loading roles, deferring authorization check");
    }
    
    return cleanup;
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
  
  // Efecto para manejar los timeouts largos
  useEffect(() => {
    if (longTimeoutReached && isAuthorized === null && user && !maxAttemptsReached) {
      // Forzar una actualización de roles si hemos esperado demasiado y estamos por debajo del máximo de intentos
      if (roleRefreshAttempts < MAX_ROLE_REFRESH_ATTEMPTS) {
        console.log("Authorization: Long timeout reached, forcing role refresh");
        forceRoleRefresh();
      }
    }
  }, [longTimeoutReached, isAuthorized, user, maxAttemptsReached, roleRefreshAttempts]);
  
  // Efecto para mostrar errores cuando la autorización falla
  useEffect(() => {
    if (isAuthorized === false && authCheckComplete && userRoles.length > 0) {
      toast.error("Acceso denegado", {
        description: "No tienes los permisos necesarios para acceder a esta página"
      });
    }
  }, [isAuthorized, authCheckComplete, userRoles.length]);

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
