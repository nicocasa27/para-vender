
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

/**
 * Validador de UUID mejorado con mensajes de diagnóstico
 */
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
 * Validador de email
 */
const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || email === "null" || email === "undefined" || email.trim() === "") return false;
  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Función para obtener un UUID válido a partir de un email
 * Implementa la lógica sugerida, intentando obtener el UUID desde Supabase
 */
const getUserIdByEmail = async (email: string): Promise<string | null> => {
  console.log("Buscando usuario por email:", email);
  
  if (!isValidEmail(email)) {
    console.error("Email inválido, no se puede buscar usuario");
    return null;
  }

  try {
    // Primero intentamos buscar en la tabla profiles
    console.log("Método 1: Buscando en tabla profiles");
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error al buscar en profiles:", profileError);
    }
    
    // Si encontramos el perfil, usamos su ID
    if (profileData?.id && isValidUUID(profileData.id)) {
      console.log("Usuario encontrado en profiles:", profileData.id);
      return profileData.id;
    }
    
    // Si no, intentamos usar la Edge Function
    console.log("Método 2: Usando Edge Function");
    const { data: userData, error: edgeFunctionError } = await supabase.functions
      .invoke("get_user_id_by_email", {
        body: { email }
      });
      
    if (edgeFunctionError) {
      console.error("Error en Edge Function:", edgeFunctionError);
      throw new Error(`Error al buscar usuario: ${edgeFunctionError.message || 'Error desconocido'}`);
    }
    
    if (!userData) {
      console.error("Edge Function no retornó datos");
      return null;
    }
    
    const userId = userData as string;
    
    if (!isValidUUID(userId)) {
      console.error("Edge Function retornó un UUID inválido:", userId);
      return null;
    }
    
    console.log("Usuario encontrado con Edge Function:", userId);
    return userId;
    
  } catch (error) {
    console.error("Error al buscar usuario por email:", error);
    return null;
  }
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
    
    // Log detallado para depurar 
    console.log("useRoleAssignmentV2: Validando usuario:", {
      id: user.id,
      tipo: typeof user.id,
      longitud: user.id ? user.id.length : 0,
      nombre: user.full_name || user.email || "Sin nombre",
      email: user.email || "Sin email",
      profiles: user.profiles ? "presente" : "ausente"
    });
    
    // Priorizar el email como identificador principal
    const email = user.email || user.profiles?.email;
    
    if (!isValidEmail(email)) {
      console.error("useRoleAssignmentV2: Email de usuario no disponible");
      toast.error("No se puede asignar rol: Email de usuario no disponible");
      setSelectedUserId(null);
      setUserEmail("correo@ejemplo.com");
      return false;
    }
    
    setUserEmail(email);
    
    // Si el UUID es válido, úsalo directamente
    if (isValidUUID(user.id)) {
      setSelectedUserId(user.id);
      console.log("useRoleAssignmentV2: UUID válido configurado:", user.id);
    } else {
      // Si el UUID no es válido, marcar como null para buscarlo por email después
      setSelectedUserId(null);
      console.log("useRoleAssignmentV2: UUID no válido, se usará email para búsqueda:", email);
    }
    
    // Establecer la información del usuario seleccionado
    setUserName(user.full_name || user.profiles?.full_name || email || "Usuario");
    return true;
  };

  /**
   * Maneja el envío del formulario para asignar un rol usando primariamente el email
   */
  const handleAddRole = async (values: RoleFormValues) => {
    // Validación defensiva del email de usuario
    if (!isValidEmail(userEmail)) {
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
      
      // Obtener un UUID válido, ya sea usando el seleccionado o buscando por email
      let userId = selectedUserId;
      
      // Si no tenemos un ID válido o es null, buscarlo por email
      if (!userId || !isValidUUID(userId)) {
        console.log("Buscando usuario por email porque no hay UUID válido");
        userId = await getUserIdByEmail(userEmail);
        
        if (!userId) {
          throw new Error(`No se pudo encontrar un UUID válido para el email ${userEmail}`);
        }
      }
      
      console.log("UUID a usar para la asignación:", userId);
      
      // Verificar que el usuario existe en tabla profiles
      const { data: profileExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      
      // Si no existe el perfil, crearlo
      if (!profileExists) {
        console.log("Creando perfil para el usuario:", userId);
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: userName,
            email: userEmail
          });
          
        if (createProfileError && createProfileError.code !== '23505') {
          console.error("Error al crear perfil:", createProfileError);
        }
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
      
      // Asegurar que almacen_id sea null explícitamente cuando no se proporciona
      const insertData = {
        user_id: userId,
        role: values.role,
        almacen_id: values.store_id && values.store_id.trim() !== "" ? values.store_id : null,
      };
      
      console.log("Datos finales a insertar:", insertData);
      
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
