
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserRole, UserRoleWithStore, UserWithRoles } from '@/types/auth';
import { fetchUserRoles, checkHasRole } from './auth-utils';
import { toast as sonnerToast } from "sonner";

// Constant for controlling role loading retries
const MAX_ROLE_LOADING_RETRIES = 3;
const ROLE_LOADING_RETRY_DELAY = 1000; // ms

export const useAuthProvider = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLoadingAttempt, setRoleLoadingAttempt] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadUserRoles = async (userId: string, forceRefresh = false): Promise<UserRoleWithStore[]> => {
    if (!userId) return [];
    
    console.log("Auth: Loading roles for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
    // If we're already loading roles and it's not a forced refresh, return the current roles
    if (rolesLoading && !forceRefresh) {
      console.log("Auth: Already loading roles, returning current roles");
      return userRoles;
    }
    
    setRolesLoading(true);
    
    try {
      const roles = await fetchUserRoles(userId);
      console.log("Auth: Roles loaded:", roles);
      
      if (roles.length === 0 && roleLoadingAttempt < MAX_ROLE_LOADING_RETRIES) {
        // If we got no roles but we haven't exceeded max retries, schedule another attempt
        console.log(`Auth: No roles found, scheduling retry attempt ${roleLoadingAttempt + 1}/${MAX_ROLE_LOADING_RETRIES}`);
        setRoleLoadingAttempt(prev => prev + 1);
        
        // Schedule a retry
        setTimeout(() => {
          if (userId === user?.id) { // Only if the user is still the same
            console.log(`Auth: Executing retry attempt ${roleLoadingAttempt + 1}`);
            loadUserRoles(userId, true);
          }
        }, ROLE_LOADING_RETRY_DELAY);
      } else {
        // Reset retry counter if we got roles or hit max retries
        setRoleLoadingAttempt(0);
      }
      
      // Always update roles with whatever we got
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

  // This effect initializes auth and sets up listeners
  useEffect(() => {
    console.log("Auth: Setting up auth state listener");
    setLoading(true);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth: Auth state change event:", event, "Session:", !!currentSession);
        
        if (currentSession?.user) {
          // Update session and user state immediately
          setSession(currentSession);
          setUser(currentSession.user);
          
          // If this is a SIGNED_IN event, force a roles refresh
          if (event === 'SIGNED_IN') {
            console.log("Auth: User signed in, force refreshing roles");
            await loadUserRoles(currentSession.user.id, true);
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

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        console.log("Auth: Initializing auth, checking for existing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log("Auth: Existing session found for user:", currentSession.user.id);
          // Update session and user state
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Load roles with the session
          await loadUserRoles(currentSession.user.id);
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

  const refreshUserRoles = async (force = true): Promise<UserRoleWithStore[]> => {
    if (!user) {
      console.log("Auth: Can't refresh roles, no user logged in");
      return [];
    }
    
    console.log("Auth: Manually refreshing user roles for:", user.id, force ? "(forced)" : "");
    return await loadUserRoles(user.id, force);
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

      if (data.user) {
        console.log("Auth: Sign in successful for user:", data.user.id);
        // Setting session and user immediately, though onAuthStateChange will also trigger
        setSession(data.session);
        setUser(data.user);
        
        // Force refresh roles immediately after login
        console.log("Auth: Sign in successful, force loading roles for user:", data.user.id);
        await loadUserRoles(data.user.id, true);
      }

      sonnerToast.success("Inicio de sesión exitoso", {
        description: "Bienvenido de nuevo"
      });
      
      console.log("Auth: Sign in successful, navigating to dashboard");
      navigate("/dashboard");
      
      return data;
    } catch (error: any) {
      console.error("Auth: Sign in error:", error);
      sonnerToast.error("Error de inicio de sesión", {
        description: error.message || "Credenciales inválidas o problema de conexión"
      });
      
      return Promise.reject(error);
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
      
      return Promise.reject(error);
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
      
      // Explicitly clear auth state
      setSession(null);
      setUser(null);
      setUserRoles([]);
      
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
      
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = useCallback((role: UserRole, storeId?: string): boolean => {
    const result = checkHasRole(userRoles, role, storeId);
    console.log(`Auth: Checking if user has role '${role}'${storeId ? ` for store ${storeId}` : ''}: ${result}`, 
      `Current roles:`, userRoles);
    return result;
  }, [userRoles]);

  const getAllUsers = async (): Promise<UserWithRoles[]> => {
    try {
      console.log("Auth: Fetching all users");
      
      if (!hasRole('admin')) {
        throw new Error("No tienes permisos para ver usuarios");
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        return [];
      }
      
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          created_at,
          almacenes:almacen_id(nombre)
        `);
        
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        throw rolesError;
      }
      
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
        const userRoles = roles
          ?.filter(r => r.user_id === profile.id)
          .map(role => ({
            ...role,
            almacen_nombre: role.almacenes?.nombre || null
          })) || [];
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || null,
          roles: userRoles,
        };
      });
      
      return usersWithRoles;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      console.log("Auth: Deleting user", userId);
      
      if (!hasRole('admin')) {
        throw new Error("No tienes permisos para eliminar usuarios");
      }
      
      if (!session?.access_token) {
        throw new Error("No hay sesión de usuario");
      }
      
      const response = await fetch(`https://dyvjtczkihdncxvsjdrz.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar usuario");
      }
      
      sonnerToast.success("Usuario eliminado", {
        description: "El usuario ha sido eliminado correctamente"
      });
      
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      sonnerToast.error("Error al eliminar usuario", {
        description: error.message || "Hubo un problema al eliminar el usuario"
      });
      return false;
    }
  };

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
    getAllUsers,
    deleteUser,
  };
};
