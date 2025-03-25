
import { useState } from 'react';
import { 
  useSessionContext, 
  useAuthCredentials, 
  useRoleVerification,
  useUserManagement
} from './hooks';

export const useAuthProvider = () => {
  // Usar el hook de sesión que contiene la lógica de gestión de sesión y roles
  const { 
    session, 
    user, 
    userRoles, 
    loading, 
    rolesLoading, 
    refreshUserRoles 
  } = useSessionContext();

  // Usar el hook de verificación de roles
  const { hasRole } = useRoleVerification(userRoles);
  
  // Usar el hook de credenciales para login/logout
  const { 
    signIn, 
    signUp, 
    signOut, 
    loading: authLoading 
  } = useAuthCredentials(refreshUserRoles);
  
  // Usar el hook de administración de usuarios
  const { 
    getAllUsers, 
    deleteUser 
  } = useUserManagement(session, hasRole);

  return {
    // Datos de autenticación
    session,
    user,
    userRoles,
    loading: loading || authLoading,
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
};
