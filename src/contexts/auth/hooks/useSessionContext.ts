import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles } from '../utils/user-roles';
import { createDefaultRole } from '../utils/user-management-defaults';
import { toast } from 'sonner';

const MAX_ROLE_LOADING_RETRIES = 3;
const ROLE_LOADING_RETRY_DELAY = 1000; // ms

export function useSessionContext() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLoadingAttempt, setRoleLoadingAttempt] = useState(0);
  const pendingRoleLoadRef = useRef<Promise<UserRoleWithStore[]> | null>(null);

  // Función para cargar los roles del usuario
  const loadUserRoles = async (userId: string, forceRefresh = false): Promise<UserRoleWithStore[]> => {
    if (!userId) return [];
    
    console.log("Auth: Loading roles for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
    if (pendingRoleLoadRef.current && !forceRefresh) {
      console.log("Auth: Using existing pending role load request");
      return pendingRoleLoadRef.current;
    }
    
    setRolesLoading(true);
    
    const roleLoadPromise = (async () => {
      try {
        console.log("Auth: Starting role loading process");
        let roles: UserRoleWithStore[] = [];
        let attempt = 0;
        
        while (attempt < MAX_ROLE_LOADING_RETRIES) {
          attempt++;
          console.log(`Auth: Fetching roles attempt ${attempt}/${MAX_ROLE_LOADING_RETRIES}`);
          
          // Asegurarse de que el usuario tenga al menos un rol por defecto
          if (attempt === 1 || roles.length === 0) {
            await createDefaultRole(userId);
          }
          
          const fetchedRoles = await fetchUserRoles(userId);
          
          if (fetchedRoles.length > 0) {
            console.log(`Auth: Successfully fetched ${fetchedRoles.length} roles on attempt ${attempt}`);
            roles = fetchedRoles;
            break;
          }
          
          if (attempt < MAX_ROLE_LOADING_RETRIES) {
            console.log(`Auth: No roles found on attempt ${attempt}, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, ROLE_LOADING_RETRY_DELAY));
          }
        }
        
        console.log("Auth: Role loading process complete, setting userRoles state");
        setUserRoles(roles);
        setRoleLoadingAttempt(0);
        return roles;
      } catch (error) {
        console.error("Auth: Error during role loading:", error);
        setUserRoles([]);
        return [];
      } finally {
        setRolesLoading(false);
        if (pendingRoleLoadRef.current === roleLoadPromise) {
          pendingRoleLoadRef.current = null;
        }
      }
    })();
    
    pendingRoleLoadRef.current = roleLoadPromise;
    
    return roleLoadPromise;
  };

  // Función para actualizar manualmente los roles del usuario
  const refreshUserRoles = async (force = true): Promise<UserRoleWithStore[]> => {
    if (!user) {
      console.log("Auth: Can't refresh roles, no user logged in");
      return [];
    }
    
    console.log("Auth: Manually refreshing user roles for:", user.id, force ? "(forced)" : "");
    
    try {
      const roles = await loadUserRoles(user.id, force);
      
      if (roles.length === 0) {
        console.warn("Auth: No roles found after refresh");
        // Solo mostrar toast si es un refresh manual (force=true)
        if (force) {
          toast.warning("No se encontraron roles", {
            description: "No tienes ningún rol asignado en el sistema"
          });
        }
      } else {
        console.log("Auth: Successfully refreshed roles:", roles);
        // Solo mostrar toast si es un refresh manual (force=true)
        if (force) {
          toast.success(`${roles.length} roles cargados correctamente`);
        }
      }
      
      return roles;
    } catch (error) {
      console.error("Auth: Error refreshing roles:", error);
      // Solo mostrar toast si es un refresh manual (force=true)
      if (force) {
        toast.error("Error al actualizar roles", {
          description: "Intenta nuevamente más tarde"
        });
      }
      return [];
    }
  };

  // Configurar el listener de autenticación
  useEffect(() => {
    console.log("Auth: Setting up auth state listener");
    setLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth: Auth state change event:", event, "Session:", !!currentSession);
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Verificar si el perfil existe y crearlo si no existe
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            try {
              // Verificar si el perfil existe
              const { data: existingProfile, error: profileCheckError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', currentSession.user.id)
                .maybeSingle();
                
              if (profileCheckError) {
                console.error("Error checking profile:", profileCheckError);
              }
              
              // Si el perfil no existe, crearlo
              if (!existingProfile) {
                console.log("Profile not found, creating it");
                
                // Obtener información del usuario desde los metadatos
                const fullName = currentSession.user.user_metadata.full_name || 
                                 currentSession.user.user_metadata.name || 
                                 currentSession.user.email?.split('@')[0] || 
                                 "Usuario";
                
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    full_name: fullName
                  });
                  
                if (insertError) {
                  console.error("Error creating profile:", insertError);
                } else {
                  console.log("Profile created successfully");
                  
                  // Crear un rol por defecto para el usuario si se creó el perfil correctamente
                  await createDefaultRole(currentSession.user.id);
                }
              }
            } catch (error) {
              console.error("Exception during profile check/creation:", error);
            }
            
            console.log("Auth: User signed in, force refreshing roles");
            await loadUserRoles(currentSession.user.id, true);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log("Auth: Token refreshed, checking if roles need refresh");
            if (userRoles.length === 0) {
              console.log("Auth: No roles found after token refresh, reloading");
              await loadUserRoles(currentSession.user.id, true);
            } else {
              console.log("Auth: Roles already loaded, skipping refresh after token refresh");
            }
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
          
          // Verificar si existe el perfil y crearlo si no existe
          try {
            const { data: existingProfile, error: profileCheckError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', currentSession.user.id)
              .maybeSingle();
              
            if (profileCheckError) {
              console.error("Error checking profile during init:", profileCheckError);
            }
            
            if (!existingProfile) {
              console.log("Profile not found during init, creating it");
              
              // Obtener información del usuario desde los metadatos
              const fullName = currentSession.user.user_metadata.full_name || 
                               currentSession.user.user_metadata.name || 
                               currentSession.user.email?.split('@')[0] || 
                               "Usuario";
              
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  full_name: fullName
                });
                
              if (insertError) {
                console.error("Error creating profile during init:", insertError);
              } else {
                console.log("Profile created successfully during init");
              }
            }
          } catch (error) {
            console.error("Exception during profile check/creation at init:", error);
          }
          
          // Asegurarse de que el usuario tenga al menos un rol
          await createDefaultRole(currentSession.user.id);
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
