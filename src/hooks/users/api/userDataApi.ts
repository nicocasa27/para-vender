
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRoleWithStore } from "../types/userManagementTypes";

/**
 * Obtiene roles de usuario desde la base de datos
 */
export const fetchUserRolesData = async () => {
  console.log("Obteniendo datos de roles de usuario desde Supabase...");
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      id,
      user_id,
      role,
      almacen_id,
      created_at,
      profiles:user_id(
        id,
        email,
        full_name
      ),
      almacenes:almacen_id(nombre)
    `)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error al obtener roles de usuario:", error);
    toast.error("Error al cargar roles de usuario");
    throw error;
  }
  
  console.log(`Roles obtenidos: ${data?.length || 0}`);
  return data || [];
};

/**
 * Intenta usar la vista user_roles_with_name si está disponible
 */
export const fetchFromUserRolesView = async () => {
  try {
    const { data, error } = await supabase
      .from('user_roles_with_name')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error al obtener datos desde la vista:", error);
      return { success: false, error };
    }
    
    console.log("Datos obtenidos correctamente desde la vista user_roles_with_name");
    return { success: true, data };
  } catch (error) {
    console.error("Error al intentar usar la vista:", error);
    return { success: false, error };
  }
};

/**
 * Obtiene los roles de un usuario específico por su ID
 */
export const getUserRolesByUserId = async (userId: string): Promise<UserRoleWithStore[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        id, 
        user_id, 
        role, 
        almacen_id,
        created_at,
        almacenes:almacen_id (nombre)
      `)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Fetch user data to get email and full_name
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    return (data || []).map(role => ({
      id: role.id,
      user_id: role.user_id,
      role: role.role,
      almacen_id: role.almacen_id,
      created_at: role.created_at,
      email: userData?.email || "",
      full_name: userData?.full_name || null,
      almacen_nombre: role.almacenes?.nombre || null
    }));
  } catch (error) {
    console.error("Error al obtener roles del usuario:", error);
    return [];
  }
};
