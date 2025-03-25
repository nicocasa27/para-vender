
import { useState, useEffect } from 'react';

interface TimeoutState {
  timeoutReached: boolean;
  longTimeoutReached: boolean;
}

/**
 * Hook que maneja los timeouts relacionados a autorización
 */
export function useAuthorizationTimeout(
  authCheckComplete: boolean
): TimeoutState & { 
  setupTimeouts: () => { cleanup: () => void } 
} {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [longTimeoutReached, setLongTimeoutReached] = useState(false);

  // Esta función configura los timeouts y devuelve una función de limpieza
  const setupTimeouts = () => {
    let isMounted = true;
    setTimeoutReached(false);
    setLongTimeoutReached(false);
    
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
      }
    }, 3500);
    
    // Cleanup function
    const cleanup = () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      clearTimeout(longTimeoutTimer);
    };
    
    return { cleanup };
  };

  return {
    timeoutReached,
    longTimeoutReached,
    setupTimeouts
  };
}
