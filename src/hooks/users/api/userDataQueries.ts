import { supabase } from "@/integrations/supabase/client";
import { UserDataQueryResult } from "../types/userManagementTypes";
import { processUserData } from "../utils/userDataProcessor";
import { toast } from "sonner";

/**
 * Intenta consultar datos desde la vista optimizada user_roles_with_name
 */
export async function fetchFromUserRolesView(): Promise<UserDataQueryResult> {
  try {
    console.log("Consultando vista user_roles_with_name...");
    
    const { data: viewData, error: viewError } = await supabase
      .from('user_roles_with_name')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (viewError) {
      console.error("Error consultando vista:", viewError);
      return { success: false, error: viewError };
    }
    
    if (viewData && viewData.length > 0) {
      console.log("Datos recuperados exitosamente de la vista:", viewData.length);
      const processedData = processUserData(viewData, true);
      return { success: true, data: processedData };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error al consultar vista:", error);
    return { success: false, error };
  }
}

/**
 * Realiza una consulta manual uniendo user_roles con otras tablas cuando la vista no está disponible
 */
export async function fetchUsersWithManualJoin(): Promise<UserDataQueryResult> {
  try {
    console.log("Realizando consulta manual con joins...");
    
    // Fetch all users with their roles using a direct query to user_roles
    const { data: userRolesData, error: userRolesError } = await supabase
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
      
    if (userRolesError) {
      console.error("Error fetching user roles:", userRolesError);
      return { success: false, error: userRolesError };
    }
    
    // Si no hay datos de roles, intentar cargar solo perfiles
    if (!userRolesData || userRolesData.length === 0) {
      return await fetchOnlyProfiles();
    }
    
    // Procesar los datos obtenidos
    const processedData = processUserData(userRolesData);
    
    // Obtener perfiles adicionales que podrían no tener roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!profilesError && profiles) {
      // Añadir perfiles que no tienen roles al conjunto de resultados
      profiles.forEach(profile => {
        if (!processedData.some(user => user.id === profile.id)) {
          processedData.push({
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || "Usuario sin perfil",
            created_at: profile.created_at,
            roles: []
          });
        }
      });
    }
    
    return { success: true, data: processedData };
  } catch (error) {
    console.error("Error en consulta manual:", error);
    return { success: false, error };
  }
}

/**
 * Obtiene solamente los perfiles cuando no hay roles disponibles
 */
export async function fetchOnlyProfiles(): Promise<UserDataQueryResult> {
  try {
    console.log("Obteniendo solo perfiles (sin roles)...");
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error("Error al cargar perfiles:", profilesError);
      return { success: false, error: profilesError };
    }
    
    if (!profiles || profiles.length === 0) {
      console.log("No se encontraron perfiles");
      return { success: true, data: [] };
    }
    
    // Transformar datos de perfil al formato UserWithRoles
    const usersWithoutRoles = profiles.map(profile => ({
      id: profile.id,
      email: profile.email || "",
      full_name: profile.full_name || "Usuario sin perfil",
      created_at: profile.created_at,
      roles: []
    }));
    
    return { success: true, data: usersWithoutRoles };
  } catch (error) {
    console.error("Error al cargar perfiles:", error);
    return { success: false, error };
  }
}

/**
 * Función principal para cargar datos de usuarios
 */
export async function fetchUserData() {
  try {
    console.log("Iniciando carga de datos de usuarios...");
    
    // Intentar primero con la vista optimizada
    const viewResult = await fetchFromUserRolesView();
    if (viewResult.success && viewResult.data) {
      return viewResult.data;
    }
    
    // Si la vista falló, intentar con consulta manual
    const manualResult = await fetchUsersWithManualJoin();
    if (manualResult.success && manualResult.data) {
      return manualResult.data;
    }
    
    console.error("No se pudieron cargar los datos de usuarios");
    toast.error("Error al cargar usuarios", {
      description: "No se pudieron cargar los datos de usuarios"
    });
    
    return [];
  } catch (error) {
    console.error("Error general al cargar usuarios:", error);
    toast.error("Error al cargar usuarios", {
      description: "Ocurrió un error al procesar los datos"
    });
    return [];
  }
}
