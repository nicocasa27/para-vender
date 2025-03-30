import { UserWithRoles } from "../types/userManagementTypes";

// Esta función procesa los roles de usuario (ejemplo)
export function groupRolesByUser(data: any[]): UserWithRoles[] {
  const grouped: { [userId: string]: UserWithRoles } = {};

  data.forEach((item) => {
    if (!grouped[item.user_id]) {
      grouped[item.user_id] = {
        id: item.user_id,
        profiles: {
          full_name: item.profiles?.full_name,
          email: item.profiles?.email,
        },
        roles: [],
      };
    }

    grouped[item.user_id].roles.push({
      id: item.id,
      user_id: item.user_id,
      almacen_id: item.almacen_id,
      role: item.role,
      created_at: item.created_at,
      almacenes: {
        nombre: item.almacenes?.nombre,
      },
    });
  });

  return Object.values(grouped);
}
