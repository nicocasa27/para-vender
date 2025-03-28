
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from "sonner";

interface UseAuthOperationsProps {
  refreshUserRoles: () => Promise<any[]>;
  hasRole: (role: UserRole, storeId?: string) => boolean;
}

/**
 * Hook para manejar las operaciones de autenticación (login, registro, logout)
 */
export function useAuthOperations({ 
  refreshUserRoles,
  hasRole 
}: UseAuthOperationsProps) {
  const navigate = useNavigate();

  /**
   * Inicia sesión con email y contraseña
   */
  const signIn = useCallback(async (email: string, password: string) => {
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
        
        const roles = await refreshUserRoles();
        
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
  }, [navigate, refreshUserRoles]);

  /**
   * Registra un nuevo usuario
   */
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
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

      // Eliminada referencia a confirmación de correo, añadiendo mensaje para login inmediato
      console.log("Auth: Sign up successful, role will be assigned by database trigger");
      
      sonnerToast.success("Registro exitoso", {
        description: "Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión."
      });
      
      return data;
      
    } catch (error: any) {
      console.error("Auth: Sign up error:", error);
      sonnerToast.error("Error al registrarse", {
        description: error.message || "Hubo un problema al crear la cuenta"
      });
      
      return Promise.reject(error);
    }
  }, []);

  /**
   * Cierra la sesión del usuario
   */
  const signOut = useCallback(async () => {
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
  }, [navigate]);

  return {
    signIn,
    signUp,
    signOut
  };
}
