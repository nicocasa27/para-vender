
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Función helper para validar UUID
const isValidUUID = (uuid: string | null | undefined) => {
  if (!uuid || uuid === "null" || uuid === "undefined") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export function useRoleManagement() {
  // Función para eliminar un rol
  const deleteRole = async (roleId: string, onSuccess?: () => void) => {
    try {
      // Validar el ID del rol
      if (!isValidUUID(roleId)) {
        toast.error("ID de rol inválido");
        console.error("ID de rol inválido:", roleId);
        return;
      }
      
      console.log(`Eliminando rol con ID: ${roleId}`);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      
      // Callback de éxito opcional - SIEMPRE ejecutar si existe
      if (onSuccess) {
        console.log("Ejecutando callback después de eliminar rol");
        onSuccess();
      }
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
      if (!isValidUUID(userId)) {
        toast.error("No se puede asignar rol: ID de usuario inválido");
        console.error("ID de usuario inválido:", userId);
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
      
      // Verificar si ya existe el mismo rol para el usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', roleName)
        .eq('almacen_id', almacenId || null);
        
      if (checkError) {
        console.error("Error al verificar roles existentes:", checkError);
        throw checkError;
      }
      
      if (existingRoles && existingRoles.length > 0) {
        toast.info("El usuario ya tiene este rol asignado");
        if (onSuccess) onSuccess();
        return;
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
      if (onSuccess) {
        console.log("Ejecutando callback después de añadir rol");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error al añadir rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message
      });
    }
  };

  return { deleteRole, addRole };
}
