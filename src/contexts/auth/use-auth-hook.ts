
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
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const roles = await fetchUserRoles(currentSession.user.id);
          setUserRoles(roles);
        } else {
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const roles = await fetchUserRoles(currentSession.user.id);
        setUserRoles(roles);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    return checkHasRole(userRoles, role, storeId);
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
  };
};
