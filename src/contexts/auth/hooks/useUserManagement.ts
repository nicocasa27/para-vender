
import { useCallback } from 'react';
import { UserRole, UserWithRoles, UserRoleWithStore } from '@/types/auth';
import { fetchAllUsers } from '../auth-utils';
import { toast as sonnerToast } from "sonner";
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useUserManagement(
  session: Session | null,
  hasRole: (role: UserRole, storeId?: string) => boolean
) {
  const getAllUsers = async (): Promise<UserWithRoles[]> => {
    try {
      console.log("Auth: Fetching all users");
      
      if (!hasRole('admin')) {
        throw new Error("No tienes permisos para ver usuarios");
      }
      
      // Usamos el tipo correcto para el retorno
      const usersData = await fetchAllUsers();
      
      // Aseguramos que los datos coincidan con la interfaz UserWithRoles
      const typedUsersData: UserWithRoles[] = usersData.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
        roles: user.roles as UserRoleWithStore[]
      }));
      
      return typedUsersData;
    } catch (error) {
      console.error("Auth: Error fetching users:", error);
      throw error;
    }
  };

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log("Auth: Deleting user", userId);
      
      if (!hasRole('admin')) {
        throw new Error("No tienes permisos para eliminar usuarios");
      }
      
      if (!session?.access_token) {
        throw new Error("No hay sesión de usuario");
      }
      
      // Verificar si el usuario existe en la tabla de perfiles
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileCheckError) {
        console.error("Error al verificar perfil del usuario:", profileCheckError);
        throw profileCheckError;
      }
      
      if (!profileData) {
        console.warn("No se encontró el perfil para el usuario:", userId);
        sonnerToast.info("El usuario ya no existe en la base de datos");
        return true;
      }
      
      // 1. Primero eliminamos todos los roles del usuario
      const { error: rolesDeletionError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (rolesDeletionError) {
        console.error("Error al eliminar roles del usuario:", rolesDeletionError);
        throw rolesDeletionError;
      }
      
      // 2. Eliminamos el perfil del usuario
      const { error: profileDeletionError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileDeletionError) {
        console.error("Error al eliminar perfil del usuario:", profileDeletionError);
        throw profileDeletionError;
      }
      
      // 3. Intentamos eliminar el usuario de auth
      try {
        const response = await fetch(`https://oyydsjvmtzilfvdzyupw.supabase.co/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            userId,
            userEmail: profileData.email,
            userName: profileData.full_name
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.warn("No se pudo eliminar el usuario de auth:", data.error);
          sonnerToast.warning("El usuario se eliminó del sistema pero puede permanecer en la autenticación");
        }
      } catch (error) {
        console.warn("Error al llamar a la función de eliminar usuario:", error);
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
    getAllUsers,
    deleteUser
  };
}
