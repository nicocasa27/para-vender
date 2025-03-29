
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";

// Define la interface para la estructura de datos de user_roles_with_name
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

export function useUserManagementQuery(user: any, hasAdminRole: boolean) {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        console.log("Fetching users...");
        
        if (!user) {
          console.log("No authenticated user found");
          return [];
        }
        
        // Intentar usar la vista user_roles_with_name que ya incluye el join con profiles
        const { data: viewData, error: viewError } = await supabase
          .from('user_roles_with_name')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (viewError) {
          console.error("Error fetching from view:", viewError);
          console.log("Falling back to manual join query...");
        } else if (viewData && viewData.length > 0) {
          console.log("Successfully retrieved data from user_roles_with_name view:", viewData.length);
          
          // Agrupar resultados por usuario
          const usersMap = new Map<string, UserWithRoles>();
          
          // Procesar cada fila de la vista
          (viewData as UserRoleWithName[]).forEach(row => {
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
          console.log(`Processed ${processedUsers.length} users from view data`);
          return processedUsers;
        }
        
        // Método alternativo: consulta manual con join
        console.log("Using manual join query for user data...");
        
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
          throw userRolesError;
        }
        
        // Get unique user IDs from the roles
        const userIds = [...new Set(userRolesData.map(role => role.user_id))];
        
        if (userIds.length === 0) {
          console.log("No user roles found");
          
          // Fetch profiles without roles as a fallback
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
          }
          
          if (!profiles || profiles.length === 0) {
            console.log("No profiles found");
            return [];
          }
          
          // Transform profile data to match UserWithRoles format and normalize
          return profiles.map(profile => ({
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || "Usuario sin perfil",
            created_at: profile.created_at,
            roles: []
          }));
        }
        
        // Group roles by user
        const usersMap = new Map<string, UserWithRoles>();
        
        // Process each role and group by user_id
        userRolesData.forEach(role => {
          const userId = role.user_id;
          const profile = role.profiles || { id: userId, email: null, full_name: null };
          
          // If this user isn't in our map yet, add them
          if (!usersMap.has(userId)) {
            usersMap.set(userId, {
              id: userId,
              email: profile.email || "",
              full_name: profile.full_name || "Usuario sin perfil",
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
          .select('*')
          .order('created_at', { ascending: false });
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          // Continue with what we have instead of throwing
        } else if (profiles) {
          // Add any profiles that weren't included in the roles query
          profiles.forEach(profile => {
            if (!usersMap.has(profile.id)) {
              usersMap.set(profile.id, {
                id: profile.id,
                email: profile.email || "",
                full_name: profile.full_name || "Usuario sin perfil",
                created_at: profile.created_at,
                roles: []
              });
            }
          });
        }
        
        // Convert map values to array
        const usersWithRoles = Array.from(usersMap.values());
        
        console.log(`Processed ${usersWithRoles.length} users with roles`);
        return usersWithRoles;
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Error al cargar usuarios", {
          description: "No se pudieron cargar los usuarios"
        });
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 5000, // 5 segundos antes de considerar los datos obsoletos
    retry: 3,
    refetchInterval: 30000, // Refrescar automáticamente cada 30 segundos
    enabled: !!user && hasAdminRole // Solo ejecutar si el usuario está conectado y tiene rol de administrador
  });
}
