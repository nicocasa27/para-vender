
import { useState } from 'react';
import { UserRoleWithStore } from '@/types/auth';

const MAX_ROLE_REFRESH_ATTEMPTS = 3;

interface UseRoleRefreshOptions {
  refreshRoles: () => Promise<UserRoleWithStore[]>;
  user: any;
  checkAuthorization: () => void;
}

/**
 * Hook para manejar los intentos de actualización de roles
 */
export function useRoleRefresh({
  refreshRoles,
  user,
  checkAuthorization
}: UseRoleRefreshOptions) {
  const [roleRefreshAttempts, setRoleRefreshAttempts] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  
  // Función para forzar una actualización de roles y reintentar la autorización
  const forceRoleRefresh = async () => {
    if (!user) return;
    
    console.log("Authorization: Forcing role refresh");
    const newAttemptCount = roleRefreshAttempts + 1;
    setRoleRefreshAttempts(newAttemptCount);
    
    // Verificar si hemos alcanzado el máximo de intentos
    if (newAttemptCount >= MAX_ROLE_REFRESH_ATTEMPTS) {
      console.log("Authorization: Max attempts reached");
      setMaxAttemptsReached(true);
    }
    
    try {
      const refreshedRoles = await refreshRoles();
      console.log("Authorization: Roles refreshed:", refreshedRoles);
      // Re-check authorization with the new roles
      checkAuthorization();
    } catch (error) {
      console.error("Authorization: Error refreshing roles:", error);
    }
  };
  
  return {
    roleRefreshAttempts,
    maxAttemptsReached,
    forceRoleRefresh,
    MAX_ROLE_REFRESH_ATTEMPTS
  };
}
