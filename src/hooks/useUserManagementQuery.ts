
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
        console.log("Profile data:", profiles);
        profiles.forEach(profile => {
          console.log(`Perfil ID: ${profile.id}, Email: ${profile.email}, Nombre: ${profile.full_name}, Creado: ${profile.created_at}`);
        });
        
        // Traer TODOS los roles de usuario
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
        
        // Combinar los datos con mejor manejo de errores
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
        usersWithRoles.forEach(user => {
          console.log(`Usuario combinado - ID: ${user.id}, Email: ${user.email}, Roles: ${user.roles.length}`);
        });
        
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
    staleTime: 5000, // 5 segundos antes de considerar los datos obsoletos (reducido de 10s)
    retry: 3, // Aumentado para más intentos
    refetchInterval: 10000, // Refrescar cada 10 segundos automáticamente
    enabled: !!user && hasAdminRole // Solo ejecutar la consulta si el usuario está conectado y tiene rol de administrador
  });
}
