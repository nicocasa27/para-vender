import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserRole, UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles, checkHasRole } from './auth-utils';

export const useAuthProvider = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initial auth setup and session check
  useEffect(() => {
    console.log("Auth: Setting up auth state listener");
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth: Auth state change event:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log("Auth: User authenticated in state change, fetching roles");
          try {
            const roles = await fetchUserRoles(currentSession.user.id);
            console.log("Auth: Roles fetched during auth state change:", roles);
            setUserRoles(roles);
          } catch (error) {
            console.error("Auth: Error fetching roles during auth state change:", error);
            setUserRoles([]);
          }
        } else {
          console.log("Auth: No user in state change, clearing roles");
          setUserRoles([]);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("Auth: User signed out, clearing all auth state");
          setUserRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      setLoading(true);
      try {
        console.log("Auth: Initializing auth, checking for existing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log("Auth: Existing session found for user:", currentSession.user.id);
          try {
            const roles = await fetchUserRoles(currentSession.user.id);
            console.log("Auth: Roles fetched during init:", roles);
            setUserRoles(roles);
          } catch (error) {
            console.error("Auth: Error fetching roles during init:", error);
            setUserRoles([]);
          }
        } else {
          console.log("Auth: No existing session found");
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

  // Function to manually refresh user roles - useful for debugging
  const refreshUserRoles = async () => {
    if (!user) {
      console.log("Auth: Can't refresh roles, no user logged in");
      return;
    }
    
    console.log("Auth: Manually refreshing user roles for:", user.id);
    try {
      setLoading(true);
      const roles = await fetchUserRoles(user.id);
      console.log("Auth: Refreshed roles:", roles);
      setUserRoles(roles);
      return roles;
    } catch (error) {
      console.error("Auth: Error refreshing roles:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los roles de usuario",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Successful login
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Hubo un problema al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Registro exitoso",
        description: "Su cuenta ha sido creada",
      });
      
      // Note: User needs to be assigned a role by an admin
    } catch (error: any) {
      toast({
        title: "Error al registrarse",
        description: error.message || "Hubo un problema al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Hubo un problema al cerrar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = useCallback((role: UserRole, storeId?: string): boolean => {
    const result = checkHasRole(userRoles, role, storeId);
    console.log(`Auth: Checking if user has role '${role}'${storeId ? ` for store ${storeId}` : ''}: ${result}`);
    return result;
  }, [userRoles]);

  return {
    session,
    user,
    userRoles,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    refreshUserRoles,
  };
};
