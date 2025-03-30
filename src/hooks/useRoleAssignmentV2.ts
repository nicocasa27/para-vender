import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Role } from "@/types/auth";

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
      // Borramos roles anteriores del usuario
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Armamos los nuevos roles
      let newRoles;

      if (role === "sales" && almacenIds.length > 0) {
        newRoles = almacenIds.map((almacenId) => ({
          user_id: userId,
          role,
          almacen_id: almacenId,
        }));
      } else {
        newRoles = [{ user_id: userId, role }];
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(newRoles);

      if (insertError) throw insertError;

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
