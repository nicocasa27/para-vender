import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
