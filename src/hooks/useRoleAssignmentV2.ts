
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Role } from "@/hooks/users/types/userManagementTypes";
import { toast } from "sonner";

interface AssignRoleInput {
  userId: string;
  role: Role;
  almacenIds?: string[]; // Opcional: solo para rol "sales"
}

export function useRoleAssignmentV2() {
  const [loading, setLoading] = useState(false);

  const assignRole = async ({
    userId,
    role,
    almacenIds = [],
  }: AssignRoleInput): Promise<boolean> => {
    setLoading(true);

    try {
      // Validar parámetros
      if (!userId) {
        toast.error("ID de usuario inválido");
        return false;
      }
      
      // Validar que para el rol "sales" se hayan proporcionado almacenes
      if (role === "sales" && almacenIds.length === 0) {
        toast.error("Debe seleccionar al menos una sucursal para el rol de ventas");
        return false;
      }
      
      console.log(`Asignando rol ${role} al usuario ${userId} con almacenes:`, almacenIds);
      
      // Borramos roles anteriores del usuario
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error al eliminar roles existentes:", deleteError);
        toast.error("Error al eliminar roles existentes");
        throw deleteError;
      }

      // Armamos los nuevos roles
      let newRoles;

      if (role === "sales" && almacenIds.length > 0) {
        // Para rol "sales" creamos un registro por cada almacén
        newRoles = almacenIds.map((almacenId) => ({
          user_id: userId,
          role,
          almacen_id: almacenId,
        }));
        
        console.log("Creando roles para múltiples almacenes:", newRoles);
      } else {
        // Para otros roles, solo asignamos el rol sin almacén asociado
        newRoles = [{ 
          user_id: userId, 
          role,
          almacen_id: null
        }];
        
        console.log("Creando rol global:", newRoles);
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(newRoles);

      if (insertError) {
        console.error("Error al insertar nuevos roles:", insertError);
        toast.error("Error al asignar rol");
        throw insertError;
      }

      toast.success(`Rol de ${role} asignado correctamente${role === 'sales' ? ' con ' + almacenIds.length + ' sucursal(es)' : ''}`);
      return true;
    } catch (err) {
      console.error("Error al asignar rol:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignRole,
    loading,
  };
}
