
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './useSession';
import { useRoles } from './useRoles';
import { fetchAllUsers } from '@/contexts/auth/auth-utils';
import { toast as sonnerToast } from "sonner";
import { UserWithRoles } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const { session, user, loading } = useSession();
  const { userRoles, rolesLoading, loadUserRoles, refreshUserRoles, hasRole } = useRoles(user);
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Auth: Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("Auth: Sign in successful for user:", data.user.id);
        
        const roles = await loadUserRoles(data.user.id, true);
        
        if (roles.length === 0) {
          console.warn("Auth: No roles found after sign in");
          sonnerToast.warning("No se encontraron roles asignados", {
            description: "Es posible que necesites contactar a un administrador para obtener permisos"
          });
        } else {
          console.log("Auth: Successfully loaded roles after sign in:", roles);
        }
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
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log("Auth: Attempting to sign up with email:", email);
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

      console.log("Auth: Sign up successful, adding default 'viewer' role");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);
        
      if (profileError) {
        console.error("Auth: Error fetching new user profile:", profileError);
      } else if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        console.log("Auth: New user ID:", userId);
        
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "viewer"
          });
          
        if (roleError) {
          console.error("Auth: Error assigning default role:", roleError);
        } else {
          console.log("Auth: Default 'viewer' role assigned successfully");
        }
      } else {
        console.error("Auth: Could not find newly created user profile");
      }

      sonnerToast.success("Registro exitoso", {
        description: "Verifique su correo electrónico para confirmar su cuenta"
      });
      
    } catch (error: any) {
      console.error("Auth: Sign up error:", error);
      sonnerToast.error("Error al registrarse", {
        description: error.message || "Hubo un problema al crear la cuenta"
      });
      
      return Promise.reject(error);
    }
  };

  const signOut = async () => {
    try {
      console.log("Auth: Attempting to sign out");
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
      
      return Promise.reject(error);
    }
  };

  const getAllUsers = useCallback(async (): Promise<UserWithRoles[]> => {
    try {
      console.log("Auth: Fetching all users");
      
      if (!hasRole('admin')) {
        throw new Error("No tienes permisos para ver usuarios");
      }
      
      return await fetchAllUsers();
    } catch (error) {
      console.error("Auth: Error fetching users:", error);
      throw error;
    }
  }, [hasRole]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
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
  }, [hasRole, session]);

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
}
