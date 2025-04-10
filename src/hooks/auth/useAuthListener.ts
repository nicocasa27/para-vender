
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
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Verificar perfil cuando el usuario inicia sesión
          if (event === 'SIGNED_IN') {
            console.log("Auth: User signed in, checking profile and roles");
            
            try {
              // Verificar si existe el perfil
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', currentSession.user.id)
                .single();
                
              if (profileError || !profile) {
                console.log("Auth: Profile not found, creating it");
                
                // Crear perfil si no existe
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    full_name: currentSession.user.user_metadata.full_name || 
                              currentSession.user.email?.split('@')[0] || 
                              "Usuario"
                  });
                  
                if (insertError) {
                  console.error("Auth: Error creating profile:", insertError);
                  toast.error("Error al crear perfil de usuario");
                } else {
                  console.log("Auth: Profile created successfully");
                  
                  // Crear rol por defecto para nuevos usuarios
                  await createDefaultRole(currentSession.user.id);
                }
              }
              
              // Cargar roles en cualquier caso
              await loadUserRoles(currentSession.user.id, true);
              
            } catch (error) {
              console.error("Auth: Error during profile verification:", error);
            }
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
          
          // Verificar si el perfil existe y crearlo si no existe
          try {
            const { data: existingProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', currentSession.user.id)
              .single();
              
            if (profileError || !existingProfile) {
              console.log("Auth: Profile not found during init, creating it");
              
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  full_name: currentSession.user.user_metadata.full_name || 
                             currentSession.user.email?.split('@')[0] || 
                             "Usuario"
                });
                
              if (insertError) {
                console.error("Auth: Error creating profile during init:", insertError);
              } else {
                console.log("Auth: Profile created successfully during init");
                
                // Crear rol por defecto
                await createDefaultRole(currentSession.user.id);
              }
            }
            
            // Cargar roles
            await loadUserRoles(currentSession.user.id, true);
            
          } catch (error) {
            console.error("Auth: Error during profile check/creation at init:", error);
          }
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
