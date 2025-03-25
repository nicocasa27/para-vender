
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserWithRoles } from "@/types/auth";
import { roleAssignmentSchema, RoleAssignmentValues } from "@/components/users/validation/roleSchemas";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useRoleAssignment(
  selectedUser: UserWithRoles | null,
  stores: { id: string; nombre: string }[],
  onSuccess: () => void
) {
  const { handleError } = useSupabaseQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inicializar formulario con valores por defecto
  const form = useForm<RoleAssignmentValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: selectedUser?.id || "",
      role: "viewer",
      almacenId: "",
    },
  });

  // Actualizar formulario cuando cambia el usuario seleccionado
  useEffect(() => {
    if (selectedUser) {
      form.setValue("userId", selectedUser.id);
    }
  }, [selectedUser, form]);

  // Rol actual del formulario
  const currentRole = form.watch("role");
  const needsStore = currentRole === "sales";

  // Manejo de la asignación de rol
  const handleAddRole = async (values: RoleAssignmentValues) => {
    try {
      setIsSubmitting(true);
      console.log("Adding role:", values);
      
      // Verificar si el usuario ya tiene este rol
      if (selectedUser?.roles) {
        // Para roles regulares (no 'sales'), verificar si el usuario ya tiene este tipo de rol
        if (values.role !== 'sales') {
          const hasRole = selectedUser.roles.some(role => 
            role.role === values.role
          );
          
          if (hasRole) {
            toast.error("Error al asignar rol", {
              description: `El usuario ya tiene el rol de ${values.role}`
            });
            return;
          }
        } 
        // Para el rol 'sales', verificar si el usuario ya tiene este rol para esta tienda específica
        else if (values.almacenId) {
          const hasStoreRole = selectedUser.roles.some(role => 
            role.role === 'sales' && role.almacen_id === values.almacenId
          );
          
          if (hasStoreRole) {
            const storeName = stores.find(store => store.id === values.almacenId)?.nombre || 'esta sucursal';
            toast.error("Error al asignar rol", {
              description: `El usuario ya es vendedor en ${storeName}`
            });
            return;
          }
        }
      }
      
      // Proceder con la adición del rol
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: values.userId,
          role: values.role,
          almacen_id: values.role === "sales" ? values.almacenId : null,
        });

      if (error) {
        handleError(error, "Error al asignar rol");
        return;
      }

      toast.success("Rol asignado", {
        description: "El rol ha sido asignado correctamente"
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast.error("Error al asignar rol", {
        description: error.message || "No se pudo asignar el rol"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole
  };
}
