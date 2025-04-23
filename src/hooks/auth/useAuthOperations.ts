
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from "sonner";
import { createDefaultRole } from '@/contexts/auth/auth-utils';

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

      if (!data.user) {
        throw new Error("No se encontró información de usuario en Supabase");
      }

      console.log("Auth: Sign in successful for user:", data.user.id);
      
      // Verificar que el usuario existe en la tabla profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error("Auth: Error al verificar perfil:", profileError);
      }
      
      // Si el perfil no existe, intentamos crearlo automáticamente
      if (!profile) {
        console.warn("Auth: No se encontró perfil para el usuario, intentando crearlo");
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "Usuario"
          });
          
        if (createProfileError) {
          console.error("Auth: Error creando perfil:", createProfileError);
          await supabase.auth.signOut();
          throw new Error("Tu cuenta existe pero no se pudo sincronizar con el sistema. Por favor contacta al administrador.");
        } else {
          console.log("Auth: Perfil creado automáticamente para usuario:", data.user.id);
          sonnerToast.success("Perfil creado correctamente", {
            description: "Tu cuenta fue sincronizada con el sistema"
          });
        }
      }
      
      // Verificar que el usuario tiene roles asignados
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', data.user.id);
        
      if (rolesError) {
        console.error("Auth: Error verificando roles:", rolesError);
      }
      
      // Si el usuario no tiene roles, crear un rol por defecto (viewer)
      if (!userRoles || userRoles.length === 0) {
        console.warn("Auth: No se encontraron roles para el usuario, creando rol por defecto");
        try {
          await createDefaultRole(data.user.id);
          sonnerToast.success("Rol asignado correctamente", {
            description: "Se te asignó el rol de Visor por defecto"
          });
        } catch (roleError) {
          console.error("Auth: Error creando rol por defecto:", roleError);
          // No cerramos sesión aquí, permitimos continuar sin rol
          sonnerToast.warning("No se pudo asignar un rol", {
            description: "Algunas funciones pueden estar limitadas"
          });
        }
      }
      
      // Cargar roles del usuario
      const userRolesData = await refreshUserRoles();
      
      if (userRolesData.length === 0) {
        console.warn("Auth: No se encontraron roles después del inicio de sesión");
        sonnerToast.warning("No se encontraron roles asignados", {
          description: "Es posible que necesites contactar a un administrador para obtener permisos"
        });
      } else {
        console.log("Auth: Roles cargados correctamente después del inicio de sesión:", userRolesData);
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
      
      // Manejar mensajes de error específicos para mejorar UX
      let errorMessage = "Credenciales inválidas o problema de conexión";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Tu email no ha sido confirmado. Por favor revisa tu bandeja de entrada.";
      } else if (error.message.includes("Tu cuenta no existe")) {
        errorMessage = "Tu cuenta no existe en el sistema. Por favor regístrate primero.";
      } else if (error.message.includes("User not found")) {
        errorMessage = "Usuario no encontrado. Por favor verifica tu email o regístrate.";
      }
      
      sonnerToast.error("Error de inicio de sesión", {
        description: errorMessage
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
      
      // Primero verificar si el usuario ya existe en Supabase Auth
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password: password + "_check", // Modificamos la contraseña para evitar login exitoso
      });
      
      // Si no hay error, significa que el usuario ya existe
      if (!checkError || (checkError.message && !checkError.message.includes("Invalid login credentials"))) {
        throw new Error("Este usuario ya existe. Por favor inicia sesión en lugar de registrarte.");
      }
      
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin + '/auth',
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("No se pudo crear el usuario en Supabase");
      }
      
      console.log("Auth: User created successfully in Supabase Auth:", data.user.id);
      
      // Crear perfil en profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName
        });
        
      if (profileError) {
        console.error("Auth: Error creando perfil:", profileError);
      } else {
        console.log("Auth: Perfil creado correctamente");
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
        console.error("Auth: Error creando rol por defecto:", roleError);
      } else {
        console.log("Auth: Rol por defecto creado correctamente");
      }
      
      // Para asegurar sincronización completa, llamar a la función sync-users
      try {
        const { error: syncError } = await supabase.functions.invoke("sync-users", {
          body: { 
            forceUpdate: true,
            forceSyncAll: false,
            specificUserId: data.user.id
          },
        });
        
        if (syncError) {
          console.error("Auth: Error llamando a sync-users:", syncError);
        } else {
          console.log("Auth: Usuario sincronizado correctamente");
        }
      } catch (syncError) {
        console.error("Auth: Error en sincronización:", syncError);
      }
      
      // Cerrar sesión para que el usuario inicie sesión correctamente
      await supabase.auth.signOut();
      
      sonnerToast.success("Registro exitoso", {
        description: "Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión."
      });
      
      return data;
      
    } catch (error: any) {
      console.error("Auth: Sign up error:", error);
      
      // Manejar mensajes de error específicos para mejorar UX
      let errorMessage = "Hubo un problema al crear la cuenta";
      
      if (error.message.includes("already exists")) {
        errorMessage = "Este email ya está registrado. Por favor inicia sesión.";
      } else if (error.message.includes("Este usuario ya existe")) {
        errorMessage = "Este email ya está registrado. Por favor inicia sesión.";
      } else if (error.message.includes("Password should be")) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.message.includes("valid email")) {
        errorMessage = "Por favor ingresa un email válido.";
      }
      
      sonnerToast.error("Error al registrarse", {
        description: errorMessage
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
