
// Re-export from the refactored structure
// Don't import from ./auth/index.ts to avoid circular references
import { AuthProvider } from './auth/AuthContext';
import { useAuthContext } from './auth/AuthContext';

// Re-export with the name that external code expects
export { AuthProvider };
export const useAuth = useAuthContext;
