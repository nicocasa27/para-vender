
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";

export function useNewUserManagement(user: any, hasAdminRole: boolean) {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        if (!user || !hasAdminRole) {
          console.log("No hay usuario autenticado o no tiene permisos de admin");
          return [];
        }

        // Obtener todos los perfiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order('created_at', { ascending: false });
          
        if (profilesError) throw profilesError;
        
        // Obtener todos los roles
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
          
        if (rolesError) throw rolesError;

        // Combinar los datos
        const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || null,
          created_at: profile.created_at,
          roles: roles?.filter(r => r.user_id === profile.id).map(role => ({
            ...role,
            almacen_nombre: role.almacenes?.nombre || null
          })) || []
        }));

        return usersWithRoles;
      } catch (error: any) {
        toast.error("Error al cargar usuarios", {
          description: error.message
        });
        throw error;
      }
    },
    refetchInterval: 5000,
    enabled: !!user && hasAdminRole
  });

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Rol eliminado correctamente");
      await refetch();
    } catch (error: any) {
      toast.error("Error al eliminar rol", {
        description: error.message
      });
    }
  };

  return {
    users,
    isLoading,
    refetch,
    handleDeleteRole
  };
}
