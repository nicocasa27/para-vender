
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
          .maybeSingle();
          
        if (profileError) {
          console.error("Auth: Error checking profile:", profileError);
          // Intentar crear el perfil automáticamente
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "Usuario"
            });
            
          if (createError) {
            console.error("Auth: Failed to create profile automatically:", createError);
            await supabase.auth.signOut();
            throw new Error("No se pudo sincronizar tu cuenta con el sistema. Por favor contacta al administrador.");
          } else {
            console.log("Auth: Created profile automatically");
            sonnerToast.success("Perfil creado automáticamente", {
              description: "Tu cuenta ha sido sincronizada con el sistema"
            });
          }
        }
        
        if (!profile) {
          // Si no existe el perfil después de intentar verificarlo, intentamos crearlo
          console.warn("Auth: User exists in auth but not in profiles, attempting to create profile");
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "Usuario"
            });
            
          if (createError) {
            console.error("Auth: Failed to create profile:", createError);
            await supabase.auth.signOut();
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
            throw new Error("Tu cuenta existe en autenticación pero no se pudo sincronizar con el sistema. Por favor contacta al administrador.");
          } else {
            console.log("Auth: Created profile for user");
            sonnerToast.success("Perfil creado", {
              description: "Tu cuenta ha sido sincronizada con el sistema"
            });
          }
        }
        
        // Verificar si el usuario tiene roles y crear uno por defecto si no tiene
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', data.user.id);
          
        if (rolesError) {
          console.error("Auth: Error checking roles:", rolesError);
        }
        
        if (!roles || roles.length === 0) {
          console.warn("Auth: No roles found, creating default role");
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'viewer',
              almacen_id: null
            });
            
          if (roleError) {
            console.error("Auth: Error creating default role:", roleError);
            // No cerrar sesión, permitir al usuario continuar sin rol
            sonnerToast.warning("No se pudo asignar un rol", {
              description: "Algunas funciones podrían estar limitadas"
            });
          } else {
            console.log("Auth: Created default viewer role");
            sonnerToast.success("Rol asignado", {
              description: "Se te ha asignado el rol de Visor por defecto"
            });
          }
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
      
      // Mejorar mensajes de error para una mejor experiencia de usuario
      let errorMessage = "Credenciales inválidas o problema de conexión";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Tu email no ha sido confirmado. Por favor revisa tu bandeja de entrada.";
      } else if (error.message.includes("not found in the system")) {
        errorMessage = "Tu cuenta no existe en el sistema. Por favor regístrate primero.";
      } else if (error.message.includes("not found in profiles")) {
        errorMessage = "Tu cuenta existe pero no está sincronizada con el sistema. Se intentó sincronizar automáticamente pero falló.";
      }
      
      sonnerToast.error("Error de inicio de sesión", {
        description: errorMessage
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

        // Verificar primero si el usuario ya existe
        const { error: checkError } = await supabase.auth.signInWithPassword({
          email,
          password: password + "_check" // Modificamos la contraseña para evitar un login exitoso si existe
        });
        
        // Verificar si el error indica que el usuario ya existe
        if (!checkError || (checkError.message && !checkError.message.includes("Invalid login credentials"))) {
          console.warn("Auth: El usuario parece existir ya en el sistema");
          throw new Error("Este email ya está registrado. Por favor inicia sesión.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
            emailRedirectTo: window.location.origin + '/auth',
          },
        });

        if (error) {
          console.error("Auth: Error al registrar usuario:", error);
          throw error;
        }
        
        if (!data.user) {
          throw new Error("No se pudo registrar el usuario. Inténtalo de nuevo.");
        }

        console.log("Auth: Usuario registrado correctamente:", data);
        
        // Crear perfil inmediatamente
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || data.user.email?.split('@')[0] || "Usuario"
          });
          
        if (profileError) {
          console.error("Auth: Error al crear perfil:", profileError);
        }
        
        // Crear rol por defecto (viewer)
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'viewer',
            almacen_id: null
          });
          
        if (roleError) {
          console.error("Auth: Error al crear rol por defecto:", roleError);
        }
        
        // Llamar a la función de sincronización para asegurar todo esté correcto
        const { error: syncError } = await supabase.functions.invoke("sync-users", {
          body: { 
            forceUpdate: true,
            forceSyncAll: false,
            specificUserId: data.user.id
          },
        });
        
        if (syncError) {
          console.error("Auth: Error sincronizando usuario:", syncError);
        }
        
        // Cerrar sesión para que el usuario inicie sesión manualmente
        await supabase.auth.signOut();
        
        sonnerToast.success("Registro exitoso", {
          description: "Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión."
        });
        
        return data;
      } catch (error: any) {
        console.error("Auth: Error durante el registro:", error);
        
        let errorMessage = "Hubo un problema al registrarte";
        
        if (error.message.includes("already registered")) {
          errorMessage = "Este email ya está registrado. Por favor inicia sesión.";
        } else if (error.message.includes("ya está registrado")) {
          errorMessage = "Este email ya está registrado. Por favor inicia sesión.";
        } else if (error.message.includes("password") || error.message.includes("contraseña")) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres.";
        } else if (error.message.includes("email")) {
          errorMessage = "Por favor ingresa un email válido.";
        }
        
        sonnerToast.error("Error de registro", {
          description: errorMessage
        });
        
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
