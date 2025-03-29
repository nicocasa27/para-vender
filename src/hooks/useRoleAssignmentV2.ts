
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserWithRoles } from "@/types/auth";

// Esquema de validación para el formulario de roles
const roleSchema = z.object({
  role: z.enum(["admin", "manager", "sales", "viewer"], {
    required_error: "Debes seleccionar un rol",
  }),
  store_id: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Validador de UUID
const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || uuid === "null" || uuid === "undefined") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Hook para manejar la asignación de roles a usuarios
 */
export function useRoleAssignmentV2(onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");
  
  // Configuración del formulario con validación de Zod
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "viewer",
      store_id: undefined,
    },
  });

  const currentRole = form.watch("role");
  
  // Determinar si el rol seleccionado necesita un almacén
  const needsStore = currentRole === "sales";

  /**
   * Configura el usuario seleccionado para asignación de rol
   */
  const selectUser = (user: UserWithRoles | null) => {
    if (!user) {
      setSelectedUserId(null);
      setUserName("Usuario");
      return false;
    }
    
    // Validación de seguridad para el ID
    const userId = user.id?.toString();
    const isValid = isValidUUID(userId);
    
    if (!isValid) {
      console.error("ID de usuario inválido:", userId);
      toast.error("No se puede asignar rol: ID de usuario inválido");
      setSelectedUserId(null);
      return false;
    }
    
    // Establecer el usuario seleccionado
    setSelectedUserId(userId);
    setUserName(user.full_name || user.email || "Usuario");
    return true;
  };

  /**
   * Maneja el envío del formulario para asignar un rol
   */
  const handleAddRole = async (values: RoleFormValues) => {
    // Validación defensiva del ID de usuario
    if (!selectedUserId || !isValidUUID(selectedUserId)) {
      toast.error("No se puede asignar rol: ID de usuario inválido");
      console.error("ID de usuario inválido:", selectedUserId);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(`Asignando rol: ${values.role} a usuario: ${selectedUserId} (${userName})`);
      console.log("Almacén seleccionado:", values.store_id || "Ninguno");
      
      // Verificar si el rol ya existe para este usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUserId)
        .eq("role", values.role)
        .eq("almacen_id", values.store_id || null);
        
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      if (existingRoles && existingRoles.length > 0) {
        toast.info("El usuario ya tiene este rol asignado");
        if (onSuccess) onSuccess();
        return;
      }
      
      // Insertar el nuevo rol con UUID válido
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUserId,
          role: values.role,
          almacen_id: values.store_id || null,
        });
        
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success(`Rol de ${values.role} asignado correctamente a ${userName}`);
      form.reset();
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reinicia el formulario y el usuario seleccionado
   */
  const resetForm = () => {
    form.reset();
    setSelectedUserId(null);
    setUserName("Usuario");
  };

  return {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole,
    selectUser,
    resetForm,
    selectedUserId,
    userName,
  };
}
