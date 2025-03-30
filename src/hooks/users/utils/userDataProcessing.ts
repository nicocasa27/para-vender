import { UserWithRoles } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Procesa los datos de roles de usuario y los combina con perfiles
 */
export const processUserRolesData = async (userRolesData: any[]): Promise<UserWithRoles[]> => {
  // Group roles by user
  const usersMap = new Map<string, UserWithRoles>();
  
  console.log("Procesando datos de roles...");
  
  // Process each role and group by user_id
  userRolesData.forEach(role => {
    const userId = role.user_id;
    const profile = role.profiles || { id: userId, email: "Unknown", full_name: null };
    
    console.log("Procesando rol para usuario:", { 
      userId, 
      profile_info: { 
        id: profile.id, 
        email: profile.email,
        full_name: profile.full_name 
      } 
    });
    
    // If this user isn't in our map yet, add them
    if (!usersMap.has(userId)) {
      usersMap.set(userId, {
        id: userId,
        email: profile.email || "",
        full_name: profile.full_name || null,
        created_at: role.created_at,
        roles: []
      });
    }
    
    // Add this role to the user's roles array
    const userEntry = usersMap.get(userId);
    if (userEntry) {
      userEntry.roles.push({
        ...role,
        almacen_nombre: role.almacenes?.nombre || null
      });
    }
  });
  
  // Fetch any users without roles to include them too
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false });
    
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    // Continue with what we have instead of throwing
  } else if (profiles) {
    console.log("Perfiles adicionales cargados:", profiles.length);
    
    // Add any profiles that weren't included in the roles query
    profiles.forEach(profile => {
      if (!usersMap.has(profile.id)) {
        console.log("Añadiendo perfil sin roles:", { 
          id: profile.id, 
          email: profile.email, 
          full_name: profile.full_name 
        });
        
        usersMap.set(profile.id, {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || null,
          created_at: profile.created_at,
          roles: []
        });
      }
    });
  }
  
  // Convert map values to array
  const result = Array.from(usersMap.values());
  console.log("Resultado final de usuarios procesados:", result.slice(0, 2));
  return result;
};

/**
 * Obtiene perfiles de usuario sin roles asignados
 */
export const fetchProfilesWithoutRoles = async (): Promise<UserWithRoles[]> => {
  console.log("Cargando perfiles de usuario sin roles asignados");
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false });
    
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    throw profilesError;
  }
  
  console.log("Perfiles cargados desde Supabase:", profiles);
  
  if (!profiles || profiles.length === 0) {
    console.log("No se encontraron perfiles de usuario");
    return [];
  }
  
  console.log(`Se encontraron ${profiles.length} perfiles de usuario sin roles`);
  
  // Transform profile data to match UserWithRoles format (normalizado)
  return profiles.map(profile => ({
    id: profile.id,
    email: profile.email || "",
    full_name: profile.full_name || null,
    created_at: profile.created_at,
    roles: []
  }));
};
