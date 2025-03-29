
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserWithRoles } from "@/types/auth";

// Esquema de validación para el formulario de roles con más restricciones
const roleSchema = z.object({
  role: z.enum(["admin", "manager", "sales", "viewer"], {
    required_error: "Debes seleccionar un rol",
  }),
  store_id: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Validador de UUID mejorado
const isValidUUID = (uuid: string | null | undefined): boolean => {
  // Validación primaria: verificar si es nulo o vacío
  if (!uuid || uuid === "null" || uuid === "undefined" || uuid.trim() === "") {
    console.error("UUID inválido: valor nulo o vacío");
    return false;
  }
  
  // Validación secundaria: verificar formato con regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);
  
  if (!isValid) {
    console.error(`UUID inválido: formato incorrecto - "${uuid}"`);
  }
  
  return isValid;
};

/**
 * Hook para manejar la asignación de roles a usuarios con validación mejorada
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
   * Configura el usuario seleccionado para asignación de rol con validación mejorada
   */
  const selectUser = (user: UserWithRoles | null) => {
    // Validación inicial del objeto usuario
    if (!user) {
      console.error("useRoleAssignmentV2: Usuario nulo, no se puede seleccionar");
      toast.error("No se puede seleccionar usuario: Datos inválidos");
      setSelectedUserId(null);
      setUserName("Usuario");
      return false;
    }
    
    // Log detallado para depurar el problema
    console.log("useRoleAssignmentV2: Validando usuario:", {
      id: user.id,
      tipo: typeof user.id,
      longitud: user.id ? user.id.length : 0,
      nombre: user.full_name || user.email || "Sin nombre",
      email: user.email || "Sin email",
      profiles: user.profiles ? "presente" : "ausente"
    });
    
    // Validación estricta del ID
    if (!isValidUUID(user.id)) {
      console.error("useRoleAssignmentV2: ID de usuario inválido:", user.id);
      toast.error("No se puede asignar rol: ID de usuario inválido");
      setSelectedUserId(null);
      return false;
    }
    
    // Establecer el usuario seleccionado si pasa todas las validaciones
    console.log("useRoleAssignmentV2: Usuario válido seleccionado con ID:", user.id);
    setSelectedUserId(user.id);
    setUserName(user.full_name || user.email || "Usuario");
    return true;
  };

  /**
   * Maneja el envío del formulario para asignar un rol con validación robusta
   */
  const handleAddRole = async (values: RoleFormValues) => {
    // Validación defensiva del ID de usuario
    if (!selectedUserId || !isValidUUID(selectedUserId)) {
      toast.error("No se puede asignar rol: ID de usuario inválido o no seleccionado");
      console.error("ID de usuario inválido o no seleccionado:", selectedUserId);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Logging defensivo antes de hacer el insert
      console.log("---- DATOS DE INSERCIÓN DE ROL ----");
      console.log(`Asignando rol: ${values.role} a usuario: ${selectedUserId} (${userName})`);
      console.log("Almacén seleccionado:", values.store_id || "Ninguno");
      console.log("Estado del ID de usuario:", {
        valor: selectedUserId,
        tipo: typeof selectedUserId,
        esValido: isValidUUID(selectedUserId),
        longitud: selectedUserId.length
      });
      
      // Verificar si el rol ya existe para este usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUserId)
        .eq("role", values.role)
        .eq("almacen_id", values.store_id || null);
        
      if (checkError) {
        console.error("Error al verificar roles existentes:", checkError);
        throw new Error(checkError.message);
      }
      
      if (existingRoles && existingRoles.length > 0) {
        toast.info("El usuario ya tiene este rol asignado");
        if (onSuccess) onSuccess();
        return;
      }
      
      // Insertar el nuevo rol con UUID válido
      const insertData = {
        user_id: selectedUserId,
        role: values.role,
        almacen_id: values.store_id || null,
      };
      
      console.log("Datos a insertar:", insertData);
      
      const { data, error } = await supabase
        .from("user_roles")
        .insert(insertData)
        .select();
        
      if (error) {
        console.error("Error de inserción:", error);
        throw new Error(error.message);
      }
      
      console.log("Rol asignado correctamente:", data);
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
