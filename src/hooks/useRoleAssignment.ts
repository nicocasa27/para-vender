
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = 'admin' | 'manager' | 'sales' | 'viewer';

export function useRoleAssignment(onSuccess: () => void) {
  const [selectedRole, setSelectedRole] = useState<Role>('viewer');

  // Asignar rol a un usuario
  const assignRole = async (userId: string) => {
    if (!userId) {
      toast.error("Selecciona un usuario primero");
      return;
    }
    
    try {
      // Validar que tenemos un ID de usuario válido
      if (!userId || userId === "null" || userId === "undefined") {
        toast.error("ID de usuario inválido");
        return;
      }
      
      // Verificar si el perfil existe, si no, crearlo
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        // Error que no sea "no se encontró ningún registro"
        throw profileCheckError;
      }
      
      // Si no existe el perfil, crearlo
      if (!existingProfile) {
        console.log(`No se encontró perfil para el usuario ${userId}, creando uno...`);
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: 'Usuario',
            email: null
          });
          
        if (createProfileError) throw createProfileError;
      }
      
      // Verificar si ya existe el mismo rol para el usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', selectedRole)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingRoles) {
        toast.info("El usuario ya tiene este rol asignado");
        return;
      }
      
      // Insertar el rol
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: selectedRole
        });
        
      if (error) throw error;
      
      toast.success("Rol asignado correctamente");
      
      // Recargar la lista de usuarios
      onSuccess();
    } catch (error: any) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol", { description: error.message });
    }
  };

  return {
    selectedRole,
    setSelectedRole,
    assignRole
  };
}
