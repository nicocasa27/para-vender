
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
        
        // Get all profiles with more robust error handling and explicit ordering
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
        console.log("Profile data:", profiles);
        
        // Get all user roles with better error handling
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
        
        // Combine the data with improved error handling
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
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 segundos antes de considerar los datos obsoletos
    retry: 2,
    enabled: !!user && hasAdminRole // Solo ejecutar la consulta si el usuario está conectado y tiene rol de administrador
  });
}
