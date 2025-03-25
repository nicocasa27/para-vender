
import { useState } from 'react';
import { UserRole } from '@/types/auth';

interface UseAuthorizationCheckProps {
  user: any;
  hasRole: (role: UserRole, storeId?: string) => boolean;
  requiredRole?: UserRole;
  storeId?: string;
}

/**
 * Hook para verificar si un usuario está autorizado
 */
export function useAuthorizationCheck({
  user,
  hasRole,
  requiredRole,
  storeId
}: UseAuthorizationCheckProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Función para verificar el estado de autorización
  const checkAuthorization = () => {
    if (!user) {
      console.log("Authorization: No user found, unauthorized");
      setIsAuthorized(false);
      setAuthCheckComplete(true);
      return;
    }
    
    console.log("Authorization: Checking for user:", user.id);
    console.log("Authorization: Required role:", requiredRole || "None specified");
    
    // Si no se requiere un rol específico, considerar autorizado
    if (!requiredRole) {
      console.log("Authorization: No specific role required, access granted");
      setIsAuthorized(true);
      setAuthCheckComplete(true);
      return;
    }
    
    // Verificar si el usuario tiene el rol requerido
    const authorized = hasRole(requiredRole, storeId);
    console.log(`Authorization: User has role ${requiredRole}?`, authorized);
    
    if (authorized) {
      console.log("Authorization: User is authorized");
      setIsAuthorized(true);
      setAuthCheckComplete(true);
    } else {
      console.log("Authorization: User is not authorized");
      setIsAuthorized(false);
      setAuthCheckComplete(true);
    }
  };
  
  // Función para establecer la autorización manualmente (para casos de emergencia/timeout)
  const setEmergencyAuthorization = (value: boolean) => {
    setIsAuthorized(value);
    setAuthCheckComplete(true);
  };
  
  return {
    isAuthorized,
    authCheckComplete,
    checkAuthorization,
    setEmergencyAuthorization
  };
}
