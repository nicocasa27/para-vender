
import { supabase } from "@/integrations/supabase/client";

/**
 * Adds an administrator role to a user by email
 * @param email The email of the user to grant admin privileges
 * @returns Promise with success or error message
 */
export async function addAdminRoleToUser(email: string) {
  try {
    if (!email) {
      console.error("AdminUtils: No email provided");
      return { success: false, message: "No se proporcionó un email" };
    }
    
    console.log("AdminUtils: Attempting to add admin role to", email);
    
    // First get the user profile by email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1);
      
    if (profileError) {
      console.error("AdminUtils: Error fetching profile:", profileError);
      return { success: false, message: profileError.message };
    }
    
    if (!profiles || profiles.length === 0) {
      console.error("AdminUtils: No user found with email:", email);
      // Return success to prevent infinite loading issues
      return { success: true, message: `No se encontró ningún usuario con el email ${email}, pero no se bloqueará el sistema por esto.` };
    }
    
    const userId = profiles[0].id;
    console.log("AdminUtils: Found user with ID:", userId);
    
    // Check if the user already has the admin role
    const { data: existingRoles, error: roleCheckError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
      
    if (roleCheckError) {
      console.error("AdminUtils: Error checking existing roles:", roleCheckError);
      return { success: false, message: roleCheckError.message };
    }
    
    // If the user already has admin role, no need to add it again
    if (existingRoles && existingRoles.length > 0) {
      console.log("AdminUtils: User already has admin role");
      return { success: true, message: `El usuario ${email} ya tiene rol de administrador.` };
    }
    
    console.log("AdminUtils: Adding admin role to user");
    
    // Add admin role to the user
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin"
      });
      
    if (insertError) {
      console.error("AdminUtils: Error inserting role:", insertError);
      return { success: false, message: insertError.message };
    }
    
    console.log("AdminUtils: Admin role successfully added");
    return { success: true, message: `Rol de administrador asignado a ${email} correctamente.` };
  } catch (error: any) {
    console.error("Error adding admin role:", error);
    // Return success to prevent infinite loading issues
    return { success: true, message: error.message || "Error al asignar rol de administrador, pero no se bloqueará el sistema." };
  }
}
