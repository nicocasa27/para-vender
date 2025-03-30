import { UserWithRoles } from "@/types/auth";

interface UserRoleWithName {
  id?: string;
  user_id: string;
  role: "admin" | "manager" | "sales" | "viewer";
  almacen_id: string | null;
  created_at: string;
  full_name: string | null;
  email: string | null;
  almacen_nombre?: string | null;
}

/**
 * Transforma los datos obtenidos de la vista user_roles_with_name
 * en un formato compatible con UserWithRoles
 */
export const transformViewData = (viewData: UserRoleWithName[]): UserWithRoles[] => {
  if (!viewData || viewData.length === 0) {
    return [];
  }
  
  console.log("Transformando datos de la vista...");

  // Agrupar resultados por usuario
  const usersMap = new Map<string, UserWithRoles>();
  
  // Procesar cada fila de la vista
  viewData.forEach(row => {
    const userId = row.user_id;
    
    // Si este usuario aún no está en nuestro mapa, añadirlo
    if (!usersMap.has(userId)) {
      usersMap.set(userId, {
        id: userId,
        email: row.email || "",
        full_name: row.full_name || "Usuario sin perfil",
        created_at: row.created_at,
        roles: []
      });
    }
    
    // Añadir este rol al array de roles del usuario
    const userEntry = usersMap.get(userId);
    if (userEntry && row.role) {
      userEntry.roles.push({
        id: row.id || "",
        user_id: userId,
        role: row.role,
        almacen_id: row.almacen_id || null,
        created_at: row.created_at || new Date().toISOString(),
        almacen_nombre: row.almacen_nombre || null
      });
    }
  });
  
  // Convertir Map a array
  const processedUsers = Array.from(usersMap.values());
  console.log(`Procesados ${processedUsers.length} usuarios desde datos de vista`);
  return processedUsers;
};
