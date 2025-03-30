
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
      
      console.log("Fetching all profiles first...");
      
      // 1. Obtenemos todos los perfiles primero
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log(`Found ${allProfiles.length} profiles in total`);
      console.log("Profile IDs:", allProfiles.map(p => p.id));
      
      // 2. Luego obtenemos todos los roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, almacenes(*)');
        
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        throw rolesError;
      }
      
      console.log(`Found ${allRoles.length} roles in total`);
      console.log("Role user_ids:", allRoles.map(r => r.user_id));
      
      // 3. Mapeamos los perfiles y les asignamos sus roles correspondientes
      const usersWithRoles: UserWithRoles[] = allProfiles.map(profile => {
        // Filtramos los roles que pertenecen a este usuario
        const userRoles = allRoles.filter(role => role.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: userRoles.map(role => ({
            ...role,
            created_at: role.created_at || new Date().toISOString(),
            almacen_nombre: role.almacenes?.nombre || null
          }))
        };
      });
      
      console.log(`Processed ${usersWithRoles.length} users with their roles`);
      console.log("Users with roles:", usersWithRoles.map(u => ({
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
