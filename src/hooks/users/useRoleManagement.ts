
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRoleManagement() {
  // Eliminar un rol de usuario
  const deleteRole = async (roleId: string, onSuccess?: () => void) => {
    try {
      console.log(`Eliminando rol con ID: ${roleId}`);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      
      // Callback para actualizar la lista de usuarios
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", {
        description: error.message
      });
    }
  };

  // Añadir un rol a un usuario
  const addRole = async (
    userId: string, 
    roleName: "admin" | "manager" | "sales" | "viewer", 
    almacenId?: string,
    onSuccess?: () => void
  ) => {
    try {
      console.log(`Añadiendo rol ${roleName} al usuario ${userId}${almacenId ? ` para almacén ${almacenId}` : ''}`);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: roleName,
          almacen_id: almacenId || null
        });
        
      if (error) throw error;
      
      toast.success("Rol asignado correctamente");
      
      // Callback para actualizar la lista de usuarios
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al añadir rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message
      });
    }
  };

  return {
    deleteRole,
    addRole
  };
}
