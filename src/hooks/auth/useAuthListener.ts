
import { useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleWithStore } from '@/types/auth';

/**
 * Hook para escuchar cambios en el estado de autenticación
 */
export function useAuthListener(
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setUserRoles: (roles: UserRoleWithStore[]) => void,
  setLoading: (loading: boolean) => void,
  loadUserRoles: (userId: string, forceRefresh?: boolean) => Promise<UserRoleWithStore[]>
) {
  useEffect(() => {
    console.log("Auth: Setting up auth state listener");
    setLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth: Auth state change event:", event, "Session:", !!currentSession);
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          if (event === 'SIGNED_IN') {
            console.log("Auth: User signed in, force refreshing roles");
            await loadUserRoles(currentSession.user.id, true);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log("Auth: Token refreshed, checking if roles need refresh");
          } else {
            console.log("Auth: User authenticated in state change, fetching roles");
            await loadUserRoles(currentSession.user.id);
          }
        } else {
          console.log("Auth: No user in state change, clearing auth state");
          setSession(null);
          setUser(null);
          setUserRoles([]);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("Auth: User signed out, clearing all auth state");
          setSession(null);
          setUser(null);
          setUserRoles([]);
        }
        
        setLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        console.log("Auth: Initializing auth, checking for existing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log("Auth: Existing session found for user:", currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
          
          await loadUserRoles(currentSession.user.id, true);
        } else {
          console.log("Auth: No existing session found");
          setSession(null);
          setUser(null);
          setUserRoles([]);
        }
      } catch (error) {
        console.error("Auth: Error during auth initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log("Auth: Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);
}
