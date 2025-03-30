
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRoleManagement() {
  // Eliminar un rol de usuario
  const deleteRole = async (roleId: string, onSuccess: () => void) => {
    try {
      if (!roleId) {
        toast.error("ID de rol inválido");
        return;
      }
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", { description: error.message });
    }
  };

  return { deleteRole };
}
