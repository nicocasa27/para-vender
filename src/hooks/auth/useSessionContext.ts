
import { User } from '@supabase/supabase-js';
import { UserRoleWithStore } from '@/types/auth';
import { useSessionManager } from './useSessionManager';
import { useRoleLoader } from './useRoleLoader';
import { useAuthListener } from './useAuthListener';

/**
 * Hook principal que maneja el contexto de sesión y roles del usuario
 */
export function useSessionContext() {
  // Obtener estado y setters de la sesión
  const {
    session,
    setSession,
    user,
    setUser,
    userRoles,
    setUserRoles,
    loading,
    setLoading,
    rolesLoading,
    setRolesLoading,
    roleLoadingAttempt,
    setRoleLoadingAttempt,
    pendingRoleLoadRef
  } = useSessionManager();

  // Obtener funciones para cargar roles
  const { loadUserRoles, refreshUserRoles: refreshRoles } = useRoleLoader(
    setRolesLoading,
    setUserRoles,
    setRoleLoadingAttempt,
    pendingRoleLoadRef
  );

  // Configurar el listener de autenticación
  useAuthListener(
    setSession,
    setUser,
    setUserRoles,
    setLoading,
    loadUserRoles
  );

  // Wrapper para refreshUserRoles que no requiere pasar user
  const refreshUserRoles = async (force = true): Promise<UserRoleWithStore[]> => {
    return refreshRoles(user, force);
  };

  return {
    session,
    user,
    userRoles,
    loading,
    rolesLoading,
    refreshUserRoles,
    setUserRoles
  };
}
