
import { useCallback } from 'react';
import { UserRole, UserWithRoles } from '@/hooks/users/types/userManagementTypes';
import { fetchAllUsers } from '../contexts/auth/auth-utils';
import { toast as sonnerToast } from "sonner";
import { Session } from '@supabase/supabase-js';

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
      
      return await fetchAllUsers();
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
    getAllUsers,
    deleteUser
  };
}
