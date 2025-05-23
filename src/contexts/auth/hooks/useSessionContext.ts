
import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles } from '../utils/user-roles';
import { createDefaultRole } from '../utils/user-management-defaults';

const MAX_ROLE_LOADING_RETRIES = 2; // Reducido de 3 a 2
const ROLE_LOADING_RETRY_DELAY = 500; // Reducido de 1000ms a 500ms

export function useSessionContext() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLoadingAttempt, setRoleLoadingAttempt] = useState(0);
  const pendingRoleLoadRef = useRef<Promise<UserRoleWithStore[]> | null>(null);
  const rolesCache = useRef<{ [userId: string]: UserRoleWithStore[] }>({});

  // Función optimizada para cargar los roles del usuario con cache
  const loadUserRoles = async (userId: string, forceRefresh = false): Promise<UserRoleWithStore[]> => {
    if (!userId) return [];
    
    console.log("Auth: Loading roles for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
    // Verificar cache primero si no es refresh forzado
    if (!forceRefresh && rolesCache.current[userId]) {
      console.log("Auth: Using cached roles");
      setUserRoles(rolesCache.current[userId]);
      return rolesCache.current[userId];
    }
    
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
          
          // Solo crear rol por defecto en el primer intento
          if (attempt === 1) {
            await createDefaultRole(userId);
          }
          
          const fetchedRoles = await fetchUserRoles(userId);
          
          if (fetchedRoles.length > 0) {
            console.log(`Auth: Successfully fetched ${fetchedRoles.length} roles on attempt ${attempt}`);
            roles = fetchedRoles;
            // Guardar en cache
            rolesCache.current[userId] = roles;
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

  // Función simplificada para actualizar roles
  const refreshUserRoles = async (force = true): Promise<UserRoleWithStore[]> => {
    if (!user) {
      console.log("Auth: Can't refresh roles, no user logged in");
      return [];
    }
    
    console.log("Auth: Refreshing user roles for:", user.id, force ? "(forced)" : "");
    
    try {
      // Limpiar cache si es refresh forzado
      if (force) {
        delete rolesCache.current[user.id];
      }
      
      const roles = await loadUserRoles(user.id, force);
      
      if (roles.length === 0) {
        console.warn("Auth: No roles found after refresh");
      } else {
        console.log("Auth: Successfully refreshed roles:", roles);
      }
      
      return roles;
    } catch (error) {
      console.error("Auth: Error refreshing roles:", error);
      return [];
    }
  };

  // Configurar el listener de autenticación optimizado
  useEffect(() => {
    console.log("Auth: Setting up auth state listener");
    setLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth: Auth state change event:", event, "Session:", !!currentSession);
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Solo procesar perfiles y roles en eventos específicos
          if (event === 'SIGNED_IN') {
            try {
              // Verificar perfil solo en sign in
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', currentSession.user.id)
                .maybeSingle();
                
              if (!existingProfile) {
                console.log("Profile not found, creating it");
                
                const fullName = currentSession.user.user_metadata.full_name || 
                                 currentSession.user.user_metadata.name || 
                                 currentSession.user.email?.split('@')[0] || 
                                 "Usuario";
                
                await supabase
                  .from('profiles')
                  .insert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    full_name: fullName
                  });
                  
                console.log("Profile created successfully");
              }
            } catch (error) {
              console.error("Error during profile check/creation:", error);
            }
            
            console.log("Auth: User signed in, loading roles");
            await loadUserRoles(currentSession.user.id, true);
          } else if (event === 'TOKEN_REFRESHED') {
            // En token refresh, solo cargar roles si no los tenemos
            if (userRoles.length === 0) {
              console.log("Auth: Token refreshed, loading roles");
              await loadUserRoles(currentSession.user.id, false);
            }
          } else {
            // Para otros eventos, usar cache si está disponible
            console.log("Auth: User authenticated, checking for cached roles");
            if (!rolesCache.current[currentSession.user.id]) {
              await loadUserRoles(currentSession.user.id, false);
            } else {
              setUserRoles(rolesCache.current[currentSession.user.id]);
            }
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
          // Limpiar cache
          rolesCache.current = {};
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
          
          // En inicialización, verificar cache primero
          if (rolesCache.current[currentSession.user.id]) {
            console.log("Auth: Using cached roles for initialization");
            setUserRoles(rolesCache.current[currentSession.user.id]);
          } else {
            await loadUserRoles(currentSession.user.id, false);
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
