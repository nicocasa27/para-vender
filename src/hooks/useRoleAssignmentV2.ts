
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
  const [userEmail, setUserEmail] = useState<string>("correo@ejemplo.com");
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
      setUserEmail("correo@ejemplo.com");
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
    
    // Validación del email como identificador principal
    if (!user.email) {
      console.error("useRoleAssignmentV2: Email de usuario no disponible");
      toast.error("No se puede asignar rol: Email de usuario no disponible");
      setSelectedUserId(null);
      setUserEmail("correo@ejemplo.com");
      return false;
    }
    
    // Establecer también el UUID si está disponible y es válido
    if (isValidUUID(user.id)) {
      setSelectedUserId(user.id);
    } else {
      // Si el UUID no es válido, intentaremos usar solo el correo
      setSelectedUserId(null);
      console.log("useRoleAssignmentV2: UUID no válido, usando solo email:", user.email);
    }
    
    // Establecer la información del usuario seleccionado
    setUserEmail(user.email);
    setUserName(user.full_name || user.email || "Usuario");
    console.log("useRoleAssignmentV2: Usuario seleccionado con éxito, email:", user.email);
    return true;
  };

  /**
   * Maneja el envío del formulario para asignar un rol usando primariamente el email
   */
  const handleAddRole = async (values: RoleFormValues) => {
    // Validación defensiva del email de usuario
    if (!userEmail || userEmail === "correo@ejemplo.com") {
      toast.error("No se puede asignar rol: Email de usuario no válido");
      console.error("Email de usuario no válido:", userEmail);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Logging defensivo antes de hacer el insert
      console.log("---- DATOS DE ASIGNACIÓN DE ROL ----");
      console.log(`Asignando rol: ${values.role} a usuario: ${userName} (${userEmail})`);
      console.log("Almacén seleccionado:", values.store_id || "Ninguno");
      
      // Primero verificamos si existe el usuario por email y obtenemos su ID
      let userId = selectedUserId;
      
      // Si no tenemos un ID válido, buscarlo por email
      if (!userId) {
        console.log("Buscando usuario por email:", userEmail);
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", userEmail)
          .single();
          
        if (userError) {
          console.log("No se encontró perfil por email, intentando crear uno...");
          
          // Intentar buscar en auth.users usando la Edge Function
          try {
            const { data: authUserData, error: fetchError } = await supabase.functions
              .invoke("get_user_id_by_email", {
                body: { email: userEmail }
              });

            if (fetchError || !authUserData) {
              console.error("No se pudo encontrar usuario por email:", fetchError || "No hay datos");
              throw new Error("No se encontró usuario con ese email");
            }
            
            userId = authUserData as string;
            console.log("ID de usuario encontrado:", userId);
            
            // Crear perfil para este usuario
            const { error: createProfileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: userName,
                email: userEmail
              });
              
            if (createProfileError && createProfileError.code !== '23505') { // Ignorar error de duplicado
              console.error("Error al crear perfil:", createProfileError);
            }
          } catch (error) {
            console.error("Error al buscar usuario por email:", error);
            throw new Error("No se pudo obtener el ID del usuario");
          }
        } else {
          userId = userData.id;
          console.log("ID de usuario encontrado en profiles:", userId);
        }
      }
      
      if (!userId) {
        throw new Error("No se pudo obtener un ID válido para el usuario");
      }
      
      // Verificar si el rol ya existe para este usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", values.role)
        .eq("almacen_id", values.store_id && values.store_id.trim() !== "" ? values.store_id : null);
        
      if (checkError) {
        console.error("Error al verificar roles existentes:", checkError);
        throw new Error(checkError.message);
      }
      
      if (existingRoles && existingRoles.length > 0) {
        toast.info("El usuario ya tiene este rol asignado");
        if (onSuccess) onSuccess();
        return;
      }
      
      // CORRECCIÓN CRÍTICA: Asegurar que almacen_id sea null explícitamente cuando no se proporciona
      const insertData = {
        user_id: userId,
        role: values.role,
        almacen_id: values.store_id && values.store_id.trim() !== "" ? values.store_id : null,
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
    setUserEmail("correo@ejemplo.com");
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
    userEmail,
    userName,
  };
}
