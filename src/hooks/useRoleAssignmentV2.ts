import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { roleAssignmentSchema, RoleAssignmentValues } from "@/components/users/validation/roleSchemas";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";

interface UseRoleAssignmentOptions {
  onSuccess: () => void;
}

export function useRoleAssignmentV2({ onSuccess }: UseRoleAssignmentOptions) {
  const form = useForm<RoleAssignmentValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      role: undefined,
    },
  });

  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRole = form.watch("role");
  const needsStore = currentRole === "sales";

  const handleAddRole = async (values: RoleAssignmentValues) => {
    if (!selectedUser) {
      toast.error("No se ha seleccionado usuario");
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = selectedUser.id;

      // Eliminar roles anteriores
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insertar nuevos roles
      let inserts = [];

      if (values.role === "sales") {
        if (selectedStoreIds.length === 0) {
          toast.error("Debes seleccionar al menos una sucursal");
          return;
        }

        inserts = selectedStoreIds.map((storeId) => ({
          user_id: userId,
          role: "sales",
          almacen_id: storeId,
        }));
      } else {
        inserts = [
          {
            user_id: userId,
            role: values.role,
            almacen_id: null,
          },
        ];
      }

      const { error } = await supabase.from("user_roles").insert(inserts);
      if (error) throw error;

      toast.success("Rol asignado correctamente");
      onSuccess();
      form.reset();
      setSelectedStoreIds([]);
    } catch (error: any) {
      console.error("Error al asignar rol:", error.message);
      toast.error("Error al asignar rol", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole,
    selectedStoreIds,
    setSelectedStoreIds,
    setSelectedUser,
  };
}
