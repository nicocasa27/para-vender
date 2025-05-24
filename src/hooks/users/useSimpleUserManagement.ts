
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserWithRoles } from '@/types/auth';
import { toast } from 'sonner';
import { DebugLogger } from '@/utils/debugLogger';

export function useSimpleUserManagement(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!isAdmin) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      DebugLogger.log("SimpleUserManagement: Fetching all profiles");
      
      // Obtener todos los perfiles primero
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      DebugLogger.log(`SimpleUserManagement: Found ${profiles?.length || 0} profiles`);

      // Obtener todos los roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, almacenes(nombre)');

      if (rolesError) {
        throw rolesError;
      }

      DebugLogger.log(`SimpleUserManagement: Found ${allRoles?.length || 0} roles`);

      // Combinar datos
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => {
        const userRoles = allRoles?.filter(role => role.user_id === profile.id) || [];
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || "Usuario sin nombre",
          created_at: profile.created_at,
          roles: userRoles.map(role => ({
            id: role.id,
            user_id: role.user_id,
            role: role.role,
            almacen_id: role.almacen_id,
            created_at: role.created_at,
            almacen_nombre: role.almacenes?.nombre || null
          }))
        };
      }) || [];

      DebugLogger.log(`SimpleUserManagement: Processed ${usersWithRoles.length} users`);
      setUsers(usersWithRoles);
      
    } catch (err: any) {
      DebugLogger.log("SimpleUserManagement: Error fetching users:", err);
      setError(err.message || "Error desconocido");
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      
      await fetchUsers(); // Refrescar la lista
      toast.success("Rol eliminado correctamente");
    } catch (err: any) {
      DebugLogger.log("SimpleUserManagement: Error deleting role:", err);
      toast.error("Error al eliminar rol");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    deleteRole
  };
}
