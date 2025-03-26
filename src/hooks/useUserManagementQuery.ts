
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
        
        // Obtener todos los perfiles con sus roles usando JOIN
        console.log("Fetching all profiles with their roles using JOIN");
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            email,
            full_name,
            created_at,
            user_roles(
              id,
              user_id,
              role,
              almacen_id,
              created_at,
              almacenes:almacen_id(nombre)
            )
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching profiles with roles:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log("No profiles found");
          return [];
        }
        
        console.log("Profiles with roles fetched:", data.length);
        
        // Transformar los datos al formato esperado
        const usersWithRoles: UserWithRoles[] = data.map(profile => {
          const userRoles = (profile.user_roles || []).map(role => ({
            ...role,
            almacen_nombre: role.almacenes?.nombre || null
          }));
          
          return {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || null,
            created_at: profile.created_at,
            roles: userRoles,
          };
        });
        
        console.log("Processed users with roles:", usersWithRoles.length);
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
