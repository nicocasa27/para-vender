
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
      
      // Limpiar sesión existente para evitar problemas
      await supabase.auth.signOut();
      
      // Limpiar datos almacenados localmente para evitar conflictos
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("Auth: Sign in successful for user:", data.user.id);
        
        // Verificar que el usuario exista en profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (profileError || !profile) {
          console.error("Auth: User found in auth but not in profiles");
          
          // Crear el perfil que falta en lugar de cerrar sesión
          console.log("Auth: Creating missing profile for user:", data.user.id);
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "Usuario sin nombre"
            });
            
          if (createProfileError) {
            console.error("Auth: Error creating profile:", createProfileError);
            await supabase.auth.signOut();
            throw new Error("No se pudo crear el perfil del usuario. Por favor contacte al administrador.");
          }
          
          console.log("Auth: Profile created successfully, now creating default role");
        }
        
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
      
      // Asegurar que cualquier sesión parcial sea eliminada
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
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
      
      // Limpiar sesión existente para evitar problemas
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
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
            throw profileError;
          }
          
          console.log("Auth: Profile created successfully, now creating default role");
          
          // Crear un rol por defecto para el nuevo usuario
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'viewer' as UserRole,
              almacen_id: null
            });
            
          if (roleError) {
            console.error("Auth: Error creating default role:", roleError);
            throw roleError;
          }
          
          console.log("Auth: Default role created for new user");
          
        } catch (err) {
          console.error("Auth: Exception during profile/role creation:", err);
          // Intentamos llamar a la función de sincronización como fallback
          try {
            const { error: syncError } = await supabase.functions.invoke("sync-users", {
              body: { 
                forceUpdate: true,
                forceSyncAll: true,
                specificUserId: data.user.id // Añadimos el ID específico del usuario
              },
            });
            
            if (syncError) {
              console.error("Auth: Error calling sync-users function:", syncError);
            } else {
              console.log("Auth: Successfully used sync-users as fallback");
            }
          } catch (syncErr) {
            console.error("Auth: Exception calling sync-users function:", syncErr);
          }
        }
      }
      
      console.log("Auth: Sign up successful, profile and role have been assigned");
      
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
      
      // Limpiar datos almacenados localmente antes de cerrar sesión
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
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
