
import { useState, useEffect, useCallback } from 'react';
import { UserWithRoles } from '@/hooks/users/types/userManagementTypes';
import { useRoleManagement } from './users/useRoleManagement';
import { useUserDeletion } from './users/useUserDeletion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUsersAndRoles(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  
  // Gestión de roles
  const { deleteRole } = useRoleManagement();
  
  // Eliminación de usuarios
  const { deleteUser } = useUserDeletion();

  // Function to fetch users - usando useCallback para evitar recrear la función
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isAdmin) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      console.log("Iniciando carga de usuarios desde la tabla profiles...");
      
      // 1. Obtenemos todos los perfiles primero
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log(`Encontrados ${allProfiles.length} perfiles de usuario en total`);
      
      // 2. Luego obtenemos todos los roles con información de almacenes
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, almacenes(*)');
        
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        throw rolesError;
      }
      
      console.log(`Encontrados ${allRoles.length} roles en total`);
      
      // 3. Mapeamos los perfiles y les asignamos sus roles correspondientes
      const usersWithRoles: UserWithRoles[] = allProfiles.map(profile => {
        // Filtramos los roles que pertenecen a este usuario
        const userRoles = allRoles.filter(role => role.user_id === profile.id) || [];
        
        // Si el usuario no tiene roles asignados explícitamente, le asignamos el rol predeterminado 'viewer'
        const roles = userRoles.length > 0 ? userRoles : [{
          id: `default-viewer-${profile.id}`,
          user_id: profile.id,
          role: 'viewer',
          almacen_id: null,
          created_at: profile.created_at || new Date().toISOString(),
          almacen_nombre: null
        }];
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: roles.map(role => ({
            ...role,
            created_at: role.created_at || new Date().toISOString(),
            almacen_nombre: role.almacenes?.nombre || null
          }))
        };
      });
      
      console.log(`Procesados ${usersWithRoles.length} usuarios con sus roles`);
      console.log("Usuarios con sus roles (muestra):", usersWithRoles.slice(0, 3).map(u => ({
        id: u.id, 
        email: u.email,
        roles_count: u.roles.length
      })));
      
      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err as Error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]); // Solo depende de isAdmin

  // Wrapper para asegurar que se actualiza la lista después de eliminar rol
  const handleDeleteRole = async (roleId: string) => {
    // Verificar si es un rol predeterminado (generado dinámicamente)
    if (roleId.startsWith('default-viewer-')) {
      toast.info("No es posible eliminar el rol predeterminado de 'viewer'");
      return;
    }
    
    await deleteRole(roleId);
    // Refrescar la lista después de eliminar
    await fetchUsers();
    toast.success("Rol eliminado y lista actualizada");
  };

  // Wrapper para asegurar que se actualiza la lista después de añadir rol
  const handleAddRole = async (userId: string, roleName: "admin" | "manager" | "sales" | "viewer", almacenId?: string) => {
    // Implementation would go here
    await fetchUsers();
  };

  // Wrapper para asegurar que se actualiza la lista después de eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    await fetchUsers();
  };

  // Iniciar carga de datos
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    deleteRole: handleDeleteRole,
    addRole: handleAddRole,
    deleteUser: handleDeleteUser
  };
}
