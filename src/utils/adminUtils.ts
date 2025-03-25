
import { supabase } from "@/integrations/supabase/client";

/**
 * Añade rol de administrador a un usuario solo bajo condiciones específicas
 * @param email El email del usuario a verificar
 * @param checkFirstAdmin Si es true, solo asigna admin si no hay otros admins
 * @returns Promise con resultado y mensaje
 */
export async function addAdminRoleToUser(email: string, checkFirstAdmin = false) {
  try {
    if (!email) {
      console.error("AdminUtils: No se proporcionó un email");
      return { success: false, message: "No se proporcionó un email", adminAdded: false };
    }
    
    console.log("AdminUtils: Verificando usuario:", email);
    
    // Primero obtener el perfil del usuario por email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1);
      
    if (profileError) {
      console.error("AdminUtils: Error al buscar perfil:", profileError);
      return { success: false, message: profileError.message, adminAdded: false };
    }
    
    if (!profiles || profiles.length === 0) {
      console.error("AdminUtils: No se encontró usuario con email:", email);
      return { 
        success: true, 
        message: `No se encontró ningún usuario con el email ${email}`,
        adminAdded: false 
      };
    }
    
    const userId = profiles[0].id;
    console.log("AdminUtils: Usuario encontrado con ID:", userId);
    
    // Verificar si el usuario ya tiene el rol admin
    const { data: existingRoles, error: roleCheckError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
      
    if (roleCheckError) {
      console.error("AdminUtils: Error al verificar roles existentes:", roleCheckError);
      return { success: false, message: roleCheckError.message, adminAdded: false };
    }
    
    // Si el usuario ya tiene rol admin, no es necesario agregarlo de nuevo
    if (existingRoles && existingRoles.length > 0) {
      console.log("AdminUtils: El usuario ya tiene rol de administrador");
      return { 
        success: true, 
        message: `El usuario ${email} ya tiene rol de administrador.`,
        adminAdded: false 
      };
    }
    
    // Si checkFirstAdmin es true, verificar si hay otros administradores
    if (checkFirstAdmin) {
      const { data: existingAdmins, error: adminsCheckError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin")
        .limit(1);
        
      if (adminsCheckError) {
        console.error("AdminUtils: Error al verificar administradores existentes:", adminsCheckError);
        return { success: false, message: adminsCheckError.message, adminAdded: false };
      }
      
      // Si ya hay administradores y estamos en modo verificación, no asignar otro
      if (existingAdmins && existingAdmins.length > 0) {
        console.log("AdminUtils: Ya existen otros administradores, no se asignará rol admin automáticamente");
        return { 
          success: true, 
          message: `No se asignó rol de administrador a ${email} porque ya existen otros administradores.`,
          adminAdded: false 
        };
      }
      
      console.log("AdminUtils: No se encontraron administradores, se configurará el primer admin");
    }
    
    console.log("AdminUtils: Agregando rol de administrador al usuario");
    
    // Agregar rol admin al usuario
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin"
      });
      
    if (insertError) {
      console.error("AdminUtils: Error al insertar rol:", insertError);
      return { success: false, message: insertError.message, adminAdded: false };
    }
    
    console.log("AdminUtils: Rol de administrador agregado correctamente");
    return { 
      success: true, 
      message: `Rol de administrador asignado a ${email} correctamente.`,
      adminAdded: true 
    };
  } catch (error: any) {
    console.error("AdminUtils: Error al agregar rol de administrador:", error);
    return { 
      success: false, 
      message: error.message || "Error al asignar rol de administrador", 
      adminAdded: false 
    };
  }
}
