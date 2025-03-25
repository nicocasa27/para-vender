
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserRole, UserRoleWithStore } from '@/types/auth';
import { fetchUserRoles, checkHasRole } from './auth-utils';
import { toast as sonnerToast } from "sonner";

export const useAuthProvider = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Function to load user roles
  const loadUserRoles = async (userId: string) => {
    if (!userId) return [];
    
    console.log("Auth: Loading roles for user:", userId);
    setRolesLoading(true);
    
    try {
      const roles = await fetchUserRoles(userId);
      console.log("Auth: Roles loaded:", roles);
      setUserRoles(roles);
      return roles;
    } catch (error) {
      console.error("Auth: Error loading roles:", error);
      setUserRoles([]);
      return [];
    } finally {
      setRolesLoading(false);
    }
  };

  // Initial auth setup and session check
  useEffect(() => {
    console.log("Auth: Setting up auth state listener");
    setLoading(true);
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth: Auth state change event:", event, "Session:", !!currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log("Auth: User authenticated in state change, fetching roles");
          await loadUserRoles(currentSession.user.id);
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
      try {
        console.log("Auth: Initializing auth, checking for existing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log("Auth: Existing session found for user:", currentSession.user.id);
          await loadUserRoles(currentSession.user.id);
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
      return [];
    }
    
    console.log("Auth: Manually refreshing user roles for:", user.id);
    return await loadUserRoles(user.id);
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Auth: Attempting to sign in with email:", email);
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // After successful login, immediately load user roles
      if (data.user) {
        console.log("Auth: Sign in successful, loading roles for user:", data.user.id);
        await loadUserRoles(data.user.id);
      }

      // Successful login
      sonnerToast.success("Inicio de sesión exitoso", {
        description: "Bienvenido de nuevo"
      });
      
      console.log("Auth: Sign in successful, navigating to home");
      navigate("/");
      
      return data;
    } catch (error: any) {
      console.error("Auth: Sign in error:", error);
      sonnerToast.error("Error de inicio de sesión", {
        description: error.message || "Credenciales inválidas o problema de conexión"
      });
      
      return Promise.reject(error); // Propagar el error para que el componente pueda manejarlo
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log("Auth: Attempting to sign up with email:", email);
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

      if (error) {
        throw error;
      }

      sonnerToast.success("Registro exitoso", {
        description: "Verifique su correo electrónico para confirmar su cuenta"
      });
      
      // Note: User needs to be assigned a role by an admin
    } catch (error: any) {
      console.error("Auth: Sign up error:", error);
      sonnerToast.error("Error al registrarse", {
        description: error.message || "Hubo un problema al crear la cuenta"
      });
      
      return Promise.reject(error); // Propagar el error para que el componente pueda manejarlo
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("Auth: Attempting to sign out");
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      sonnerToast.success("Sesión cerrada", {
        description: "Has cerrado sesión correctamente"
      });
      
      console.log("Auth: Sign out successful, navigating to auth page");
      navigate("/auth");
    } catch (error: any) {
      console.error("Auth: Sign out error:", error);
      sonnerToast.error("Error al cerrar sesión", {
        description: error.message || "Hubo un problema al cerrar sesión"
      });
      
      return Promise.reject(error); // Propagar el error para que el componente pueda manejarlo
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
    rolesLoading,
    signIn,
    signUp,
    signOut,
    hasRole,
    refreshUserRoles,
  };
};
