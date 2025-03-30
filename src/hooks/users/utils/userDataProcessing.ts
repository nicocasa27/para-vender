
import { UserWithRoles, UserRole } from "../types/userManagementTypes";

/**
 * Processes raw user data from Supabase into structured format
 */
export function processUserData(profiles: any[], roles: any[]): UserWithRoles[] {
  return profiles.map(profile => {
    const userRoles = roles
      ?.filter(r => r.user_id === profile.id)
      .map(role => ({
        ...role,
        almacen_nombre: role.almacenes?.nombre || null
      })) || [];
      
    return {
      id: profile.id,
      email: profile.email || "",
      full_name: profile.full_name || null,
      roles: userRoles as UserRole[],
    };
  });
}
