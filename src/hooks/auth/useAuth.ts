// IMPORTANTE: No modifiques este archivo si es de solo lectura (read_only_files).
// Si lo es, solo necesitamos utilizar las importaciones actualizadas del auth-utils.ts
// Como estamos refactorizando sin cambiar funcionalidad, este archivo debería seguir funcionando
// sin cambios dado que auth-utils.ts re-exporta todas las funciones.

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
