
import { useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { UserRoleWithStore } from '@/types/auth';

/**
 * Hook para manejar el estado relacionado con la sesión de usuario
 */
export function useSessionManager() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLoadingAttempt, setRoleLoadingAttempt] = useState(0);
  const pendingRoleLoadRef = useRef<Promise<UserRoleWithStore[]> | null>(null);

  return {
    // Estado
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
  };
}
