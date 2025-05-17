
import { UserRoleWithName, UserWithRoles } from "../types/userManagementTypes";
import { castToUserRole } from "@/types/auth";

/**
 * Procesa datos de la vista user_roles_with_name y los convierte al formato UserWithRoles
 */
export function processUserData(data: any[], isFromView = false): UserWithRoles[] {
  try {
    console.log(`Procesando ${data.length} registros de usuario desde ${isFromView ? 'vista' : 'consulta manual'}`);
    
    // Mapa para agrupar por usuario
    const usersMap = new Map<string, UserWithRoles>();
    
    // Iterar sobre cada registro
    data.forEach(row => {
      let userId: string;
      let email: string | null = null;
      let fullName: string | null = null;
      
      // Extraer datos del usuario según el formato de origen (vista o consulta join)
      if (isFromView) {
        // Formato de la vista user_roles_with_name
        userId = row.user_id;
        email = row.email;
        fullName = row.full_name;
      } else {
        // Formato de consulta join manual
        userId = row.user_id;
        const profile = row.profiles || { id: userId, email: null, full_name: null };
        email = profile.email;
        fullName = profile.full_name;
      }
      
      // Si este usuario aún no está en nuestro mapa, añadirlo
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          id: userId,
          email: email || "",
          full_name: fullName || "Usuario sin perfil",
          created_at: row.created_at,
          roles: []
        });
      }
      
      // Añadir este rol al array de roles del usuario
      const userEntry = usersMap.get(userId);
      if (userEntry && row.role) {
        // Safely handle properties that might be errors
        const isAlmacenesError = row.almacenes && row.almacenes.error === true;
        const almacenNombre = isFromView
          ? row.almacen_nombre
          : (!isAlmacenesError && row.almacenes ? row.almacenes.nombre : null);
        
        // Use type casting to ensure role is a valid UserRole
        userEntry.roles.push({
          id: row.id || "",
          user_id: userId,
          role: castToUserRole(row.role),
          almacen_id: row.almacen_id || null,
          created_at: row.created_at || new Date().toISOString(),
          almacen_nombre: almacenNombre,
          // Only include almacenes if available and not an error
          ...(row.almacenes && !isAlmacenesError && {
            almacenes: { 
              id: row.almacenes.id || "", 
              nombre: row.almacenes.nombre || "" 
            }
          })
        });
      }
    });
    
    // Convertir Map a array
    const processedUsers = Array.from(usersMap.values());
    console.log(`Procesados ${processedUsers.length} usuarios`);
    return processedUsers;
  } catch (error) {
    console.error("Error al procesar datos de usuario:", error);
    return [];
  }
}
