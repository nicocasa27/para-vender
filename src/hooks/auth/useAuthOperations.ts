
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

      console.log("Auth: Sign up successful, adding default 'viewer' role");
      
      // Esperar más tiempo para que Supabase procese la creación del perfil
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);
        
      if (profileError) {
        console.error("Auth: Error fetching new user profile:", profileError);
        throw new Error("No se pudo obtener el perfil del nuevo usuario");
      } 
      
      if (!profiles || profiles.length === 0) {
        console.error("Auth: Could not find newly created user profile for email:", email);
        
        // Intento adicional utilizando UUID del usuario creado
        if (data.user?.id) {
          console.log("Auth: Trying to find profile using user ID:", data.user.id);
          const { data: profileById, error: profileByIdError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", data.user.id)
            .limit(1);
            
          if (profileByIdError) {
            console.error("Auth: Error fetching profile by ID:", profileByIdError);
          } else if (profileById && profileById.length > 0) {
            const userId = profileById[0].id;
            console.log("Auth: Found user profile by ID:", userId);
            
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({
                user_id: userId,
                role: "viewer"
              });
              
            if (roleError) {
              console.error("Auth: Error assigning default role:", roleError);
              throw new Error("Error al asignar rol predeterminado");
            } else {
              console.log("Auth: Default 'viewer' role assigned successfully to user ID:", userId);
            }
          } else {
            console.error("Auth: Profile not found by either email or ID");
            throw new Error("No se pudo encontrar el perfil del usuario creado");
          }
        }
      } else {
        const userId = profiles[0].id;
        console.log("Auth: New user ID found by email:", userId);
        
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "viewer"
          });
          
        if (roleError) {
          console.error("Auth: Error assigning default role:", roleError);
          throw new Error("Error al asignar rol predeterminado");
        } else {
          console.log("Auth: Default 'viewer' role assigned successfully to email lookup user:", userId);
        }
      }

      sonnerToast.success("Registro exitoso", {
        description: "Se ha creado el usuario correctamente"
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
