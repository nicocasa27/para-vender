
import { useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleWithStore } from '@/types/auth';
import { toast } from 'sonner';
import { createDefaultRole } from '@/contexts/auth/utils/user-roles';

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
          // Verify that the user exists in profiles before establishing the session
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', currentSession.user.id)
              .maybeSingle();
              
            if (profileError || !profile) {
              console.error("Auth: User not found in profiles during auth change:", profileError);
              // If the user doesn't exist in profiles, sign out
              await supabase.auth.signOut();
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.removeItem('supabase.auth.token');
              setSession(null);
              setUser(null);
              setUserRoles([]);
              
              if (event === 'SIGNED_IN') {
                toast.error("Usuario no encontrado en el sistema", {
                  description: "Por favor contacte al administrador"
                });
              }
              
              setLoading(false);
              return;
            }
            
            // Valid user, set session
            setSession(currentSession);
            setUser(currentSession.user);
            
            // Verify profile when user signs in
            if (event === 'SIGNED_IN') {
              console.log("Auth: User signed in, checking profile and roles");
              
              // Load roles
              await loadUserRoles(currentSession.user.id, true);
              
            } else if (event === 'TOKEN_REFRESHED') {
              console.log("Auth: Token refreshed, checking if roles need refresh");
            } else {
              console.log("Auth: User authenticated in state change, fetching roles");
              await loadUserRoles(currentSession.user.id);
            }
          } catch (error) {
            console.error("Auth: Error verifying user profile:", error);
            // In case of error, maintain the current session but log the problem
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
          
          // Clear local storage to remove any persistent data
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          
          // Remove all supabase-related items from storage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('supabase.')) {
              localStorage.removeItem(key);
            }
          }
          
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('supabase.')) {
              sessionStorage.removeItem(key);
            }
          }
        }
        
        setLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        console.log("Auth: Initializing auth, checking for existing session");
        
        // Try to clean localStorage and sessionStorage in case of corrupt data
        try {
          // Remove any potentially corrupted tokens
          const cleanStorageItems = (storage: Storage) => {
            const itemsToRemove = [];
            
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key && key.startsWith('supabase.')) {
                try {
                  const value = storage.getItem(key);
                  if (value) {
                    try {
                      JSON.parse(value);
                    } catch (e) {
                      // If parsing fails, mark for removal
                      itemsToRemove.push(key);
                    }
                  }
                } catch (e) {
                  // If there's any error accessing the item, mark for removal
                  itemsToRemove.push(key);
                }
              }
            }
            
            // Remove all corrupted items
            itemsToRemove.forEach(key => storage.removeItem(key));
          };
          
          cleanStorageItems(localStorage);
          cleanStorageItems(sessionStorage);
        } catch (e) {
          console.error("Auth: Error cleaning storage:", e);
        }
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log("Auth: Existing session found for user:", currentSession.user.id);
          
          // Verify that the user exists in the profiles table
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentSession.user.id)
            .maybeSingle();
            
          if (profileError || !existingProfile) {
            console.log("Auth: User not found in profiles during init, signing out");
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
            setSession(null);
            setUser(null);
            setUserRoles([]);
            setLoading(false);
            return;
          }
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Load roles
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
