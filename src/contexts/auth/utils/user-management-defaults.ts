
import { supabase } from "@/integrations/supabase/client";

/**
 * Create a default role for a user if they don't have any roles
 */
export async function createDefaultRole(userId: string): Promise<boolean> {
  try {
    console.log("Creating default role for user:", userId);
    
    // Check if user already has roles
    const { data: existingRoles, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking existing roles:", checkError);
      return false;
    }
    
    if (existingRoles && existingRoles.length > 0) {
      console.log("User already has roles, not creating default");
      return true;
    }
    
    // Create default viewer role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'viewer',
        almacen_id: null
      });
      
    if (insertError) {
      console.error("Error creating default role:", insertError);
      return false;
    }
    
    console.log("Default role created successfully for user:", userId);
    return true;
  } catch (error) {
    console.error("Exception creating default role:", error);
    return false;
  }
}
