
import { supabase } from "@/integrations/supabase/client";

/**
 * Adds an administrator role to a user by email
 * @param email The email of the user to grant admin privileges
 * @returns Promise with success or error message
 */
export async function addAdminRoleToUser(email: string) {
  try {
    // First get the user profile by email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1);
      
    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      throw new Error(`No se encontró ningún usuario con el email ${email}`);
    }
    
    const userId = profiles[0].id;
    
    // Check if the user already has the admin role
    const { data: existingRoles, error: roleCheckError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
      
    if (roleCheckError) throw roleCheckError;
    
    // If the user already has admin role, no need to add it again
    if (existingRoles && existingRoles.length > 0) {
      return { success: true, message: `El usuario ${email} ya tiene rol de administrador.` };
    }
    
    // Add admin role to the user with the service_role client to bypass RLS
    // Since we're inside the AdminInitializer, this is acceptable for bootstrapping the first admin
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin"
      });
      
    if (insertError) throw insertError;
    
    return { success: true, message: `Rol de administrador asignado a ${email} correctamente.` };
  } catch (error: any) {
    console.error("Error adding admin role:", error);
    return { success: false, message: error.message || "Error al asignar rol de administrador" };
  }
}
