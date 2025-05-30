
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

export function useUserDeletion() {
  const { session } = useAuth();

  /**
   * Elimina un usuario y todos sus datos asociados de Supabase
   */
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      if (!userId) {
        toast.error("ID de usuario inválido");
        return false;
      }
      
      console.log("Iniciando proceso de eliminación completa para usuario:", userId);
      
      // 1. Verificar si el usuario existe en la tabla de perfiles
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .single();
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error("Error al verificar perfil del usuario:", profileCheckError);
        throw profileCheckError;
      }
      
      if (!profileData) {
        console.error("No se encontró el perfil para el usuario:", userId);
        toast.error("No se encontró el perfil del usuario");
        return false;
      }
      
      // 2. Eliminamos todos los roles del usuario
      const { error: rolesDeletionError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (rolesDeletionError) {
        console.error("Error al eliminar roles del usuario:", rolesDeletionError);
        throw rolesDeletionError;
      }
      
      console.log("Roles del usuario eliminados correctamente");
      
      // 3. Eliminamos el perfil del usuario
      const { error: profileDeletionError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileDeletionError) {
        console.error("Error al eliminar perfil del usuario:", profileDeletionError);
        throw profileDeletionError;
      }
      
      console.log("Perfil del usuario eliminado correctamente");
      
      // 4. Si hay una función de Edge Function para eliminar el usuario de auth, la usamos
      if (session?.access_token) {
        try {
          console.log("Intentando eliminar usuario de auth mediante Edge Function");
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
            toast.warning("El usuario se eliminó del sistema pero puede permanecer en la autenticación", {
              description: "El administrador debe eliminarlo manualmente desde Supabase Auth"
            });
          } else {
            console.log("Usuario eliminado completamente de auth:", data);
          }
        } catch (error) {
          console.warn("Error al llamar a la función de eliminar usuario:", error);
          toast.warning("El usuario se eliminó del sistema pero puede permanecer en la autenticación", {
            description: "El administrador debe eliminarlo manualmente desde Supabase Auth"
          });
        }
      } else {
        toast.warning("El usuario se eliminó del sistema pero puede permanecer en la autenticación", {
          description: "El administrador debe eliminarlo manualmente desde Supabase Auth"
        });
      }
      
      toast.success("Usuario eliminado correctamente", {
        description: "Se han eliminado el usuario y todos sus datos asociados"
      });
      
      return true;
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario", {
        description: error.message || "Hubo un problema al eliminar el usuario"
      });
      return false;
    }
  };

  return { deleteUser };
}
