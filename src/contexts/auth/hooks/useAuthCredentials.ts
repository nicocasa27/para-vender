
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from "sonner";

export function useAuthCredentials(refreshUserRoles: () => Promise<any[]>) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Auth: Attempting to sign in with email:", email);
      setLoading(true);
      
      // First clear any existing sessions to avoid issues with stale sessions
      await supabase.auth.signOut();
      
      // Clear any potentially corrupted tokens from storage
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
        
        // Verify that the user exists in profiles table - THIS IS CRITICAL
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (profileError || !profile) {
          console.error("Auth: User exists in auth but not in profiles:", profileError);
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          throw new Error("Usuario no encontrado en el sistema. Por favor contacte al administrador.");
        }
        
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
      
      // Ensure any partial session is removed
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      sonnerToast.error("Error de inicio de sesión", {
        description: error.message || "Credenciales inválidas o problema de conexión"
      });
      
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        setLoading(true);
        console.log("Auth: Registrando nuevo usuario:", email);

        // Limpiar cualquier sesión existente para evitar conflictos
        await supabase.auth.signOut();

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
          },
        });

        if (error) {
          console.error("Auth: Error al registrar usuario:", error);
          throw error;
        }

        console.log("Auth: Usuario registrado correctamente:", data);
        
        sonnerToast.success("Registro exitoso", {
          description: "Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión."
        });
        
        return data;
      } catch (error: any) {
        console.error("Auth: Error durante el registro:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = async () => {
    try {
      console.log("Auth: Attempting to sign out");
      setLoading(true);
      
      // Limpiar el almacenamiento local antes de cerrar sesión para eliminar cualquier dato persistente
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
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    loading
  };
}
