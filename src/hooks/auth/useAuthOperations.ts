
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from "sonner";
import { createDefaultRole } from '@/contexts/auth/utils/user-roles';

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
        
        // Asegurarse de que el usuario tenga un rol por defecto
        await createDefaultRole(data.user.id);
        
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
      
      // Primero creamos el usuario en Supabase Auth
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

      // Si el usuario se creó correctamente, creamos manualmente su perfil en la tabla profiles
      if (data.user) {
        console.log("Auth: User created successfully, creating profile:", data.user.id);
        
        try {
          // Insertar el perfil del usuario manualmente
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: fullName
            });
            
          if (profileError) {
            console.error("Auth: Error creating profile:", profileError);
            // No fallamos completamente si el perfil no se crea, porque puede ser debido al trigger
          }
          
          // Crear un rol por defecto para el nuevo usuario
          await createDefaultRole(data.user.id);
          console.log("Auth: Default role created for new user");
          
        } catch (profileError) {
          console.error("Auth: Exception creating profile:", profileError);
          // No fallamos completamente si el perfil no se crea
        }
      }
      
      console.log("Auth: Sign up successful, role has been assigned");
      
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
