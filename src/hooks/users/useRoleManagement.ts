
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRoleManagement() {
  // Función para eliminar un rol
  const deleteRole = async (roleId: string, onSuccess?: () => void) => {
    try {
      console.log(`Eliminando rol con ID: ${roleId}`);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      
      // Callback de éxito opcional
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", {
        description: error.message
      });
    }
  };

  // Función para añadir un rol
  const addRole = async (
    userId: string, 
    roleName: "admin" | "manager" | "sales" | "viewer", 
    almacenId?: string,
    onSuccess?: () => void
  ) => {
    try {
      // Validación defensiva del ID de usuario
      if (!userId) {
        toast.error("No se puede asignar rol: ID de usuario inválido");
        console.error("ID de usuario inválido");
        return;
      }

      console.log(`Añadiendo rol ${roleName} al usuario ${userId}${almacenId ? ` para almacén ${almacenId}` : ''}`);
      
      // Verificar si el perfil existe, si no, crearlo
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        // Si hay un error que no sea "no se encontró ningún registro"
        console.error("Error al verificar perfil de usuario:", profileCheckError);
      }
      
      // Si no existe el perfil, crearlo
      if (!existingProfile) {
        console.log(`No se encontró perfil para el usuario ${userId}, creando uno...`);
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: 'Usuario sin perfil',
            email: null
          });
          
        if (createProfileError) {
          console.error("Error al crear perfil de usuario:", createProfileError);
          throw createProfileError;
        }
        
        console.log(`Perfil creado exitosamente para el usuario ${userId}`);
      }
      
      // Insertar el rol
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: roleName,
          almacen_id: almacenId || null
        });
        
      if (error) throw error;
      
      toast.success("Rol asignado correctamente");
      
      // Callback de éxito opcional
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al añadir rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message
      });
    }
  };

  return { deleteRole, addRole };
}
