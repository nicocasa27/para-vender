
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useUserDeletion() {
  // Eliminar un usuario completamente
  const deleteUser = async (userId: string, onSuccess?: () => void) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      console.log(`Eliminando usuario con ID: ${userId}`);
      
      // Primero eliminamos los roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (rolesError) {
        console.error("Error al eliminar roles del usuario:", rolesError);
      }
      
      // Luego eliminamos el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) throw profileError;
      
      toast.success("Usuario eliminado correctamente");
      
      // Callback para actualizar la lista de usuarios
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario", {
        description: error.message
      });
    }
  };

  return { deleteUser };
}
