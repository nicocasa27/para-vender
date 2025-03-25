
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";
import { toast } from "sonner";

export function useDirectUserFetch() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("DirectUserFetch: Iniciando consulta directa a Supabase");

      // 1. Obtener todos los perfiles de usuario
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error("DirectUserFetch: Error al obtener perfiles:", profilesError);
        throw profilesError;
      }

      console.log("DirectUserFetch: Perfiles obtenidos:", profiles);

      // 2. Obtener todos los roles de usuario
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
        console.error("DirectUserFetch: Error al obtener roles:", rolesError);
        throw rolesError;
      }

      console.log("DirectUserFetch: Roles obtenidos:", roles);

      // 3. Combinar datos
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
        const userRoles = roles
          ?.filter(r => r.user_id === profile.id)
          .map(role => ({
            id: role.id,
            user_id: role.user_id,
            role: role.role,
            almacen_id: role.almacen_id,
            created_at: role.created_at,
            almacen_nombre: role.almacenes?.nombre || null
          })) || [];

        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || null,
          created_at: profile.created_at,
          roles: userRoles
        };
      });

      console.log("DirectUserFetch: Usuarios combinados:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("DirectUserFetch: Error en la consulta:", error);
      setError(error as Error);
      toast.error("Error al cargar usuarios", {
        description: "No se pudieron obtener los usuarios desde Supabase"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteRole = async (roleId: string) => {
    try {
      console.log("DirectUserFetch: Eliminando rol:", roleId);
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Rol eliminado correctamente");
      await fetchUsers(); // Refrescar la lista tras eliminar
    } catch (error: any) {
      console.error("DirectUserFetch: Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", {
        description: error.message || "No se pudo eliminar el rol"
      });
    }
  };

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
    handleDeleteRole
  };
}
