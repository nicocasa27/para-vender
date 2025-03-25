
import { useEffect } from 'react';

interface UseEmergencyTimeoutProps {
  user: any;
  authCheckComplete: boolean;
  setEmergencyAuthorization: (value: boolean) => void;
}

/**
 * Hook para manejar el timeout de emergencia final que rompe cualquier bucle infinito
 */
export function useEmergencyTimeout({
  user,
  authCheckComplete,
  setEmergencyAuthorization
}: UseEmergencyTimeoutProps) {
  useEffect(() => {
    let isMounted = true;
    
    // Agregar un timeout final para forzar romper cualquier bucle infinito después de 8 segundos
    const emergencyTimeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        console.log("Authorization: EMERGENCY TIMEOUT - Breaking infinite loop");
        
        // Si tenemos un usuario, darle el beneficio de la duda
        if (user) {
          setEmergencyAuthorization(true);
        } else {
          setEmergencyAuthorization(false);
        }
      }
    }, 8000);
    
    return () => {
      isMounted = false;
      clearTimeout(emergencyTimeoutTimer);
    };
  }, [user, authCheckComplete, setEmergencyAuthorization]);
}
