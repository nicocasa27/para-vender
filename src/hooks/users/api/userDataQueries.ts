
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "../types/userManagementTypes";
import { processUserData } from "../utils/userDataProcessing";

/**
 * Fetches user data from Supabase
 */
export async function fetchUserData(): Promise<UserWithRoles[]> {
  console.log("Fetching user data...");
  
  try {
    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (profilesError) throw profilesError;
    
    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        almacenes:almacen_id(nombre)
      `);
      
    if (rolesError) throw rolesError;
    
    // Process and combine the data
    return processUserData(profiles, roles);
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

/**
 * Gets user roles for a specific user ID
 */
export async function getUserRolesByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        almacenes:almacen_id(nombre)
      `)
      .eq("user_id", userId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching user roles:", error);
    throw error;
  }
}
