
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";

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
        
        // Traer TODOS los perfiles sin filtros para asegurar que obtenemos todos los usuarios
        console.log("Intentando obtener TODOS los perfiles de usuario sin filtros");
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order('created_at', { ascending: false });
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found");
          return [];
        }
        
        console.log("Profiles fetched:", profiles.length);
        
        // Traer TODOS los roles de usuario con JOIN a almacenes
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
          
        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
          throw rolesError;
        }
        
        console.log("Roles fetched:", roles?.length || 0);
        
        // Combinar los datos 
        const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
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
            created_at: profile.created_at,
            roles: userRoles,
          };
        });
        
        console.log("Combined users with roles:", usersWithRoles.length);
        
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
