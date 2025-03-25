
import { useSession } from './useSession';
import { useRoles } from './useRoles';
import { useAuthOperations } from './useAuthOperations';
import { useUserAdministration } from './useUserAdministration';

/**
 * Hook principal que combina todos los aspectos de autenticación
 */
export function useAuth() {
  // Obtener sesión y usuario
  const { session, user, loading } = useSession();
  
  // Gestión de roles
  const { 
    userRoles, 
    rolesLoading, 
    loadUserRoles, 
    refreshUserRoles, 
    hasRole 
  } = useRoles(user);
  
  // Operaciones de autenticación
  const { signIn, signUp, signOut } = useAuthOperations({
    refreshUserRoles,
    hasRole
  });
  
  // Administración de usuarios
  const { getAllUsers, deleteUser } = useUserAdministration({
    session,
    hasRole
  });

  return {
    // Datos de autenticación
    session,
    user,
    userRoles,
    loading,
    rolesLoading,
    
    // Operaciones de autenticación
    signIn,
    signUp,
    signOut,
    
    // Funciones de roles
    hasRole,
    refreshUserRoles,
    
    // Funciones administrativas
    getAllUsers,
    deleteUser,
  };
}
