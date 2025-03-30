
import { useState, useCallback } from 'react';
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
      
      console.log("useUsersAndRoles: Fetching users with roles...");
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        console.log("useUsersAndRoles: No profiles found");
        setUsers([]);
        setLoading(false);
        return;
      }
      
      console.log(`useUsersAndRoles: Found ${profiles.length} profiles`);
      
      // For each profile, fetch their roles
      const usersWithRoles: UserWithRoles[] = await Promise.all(
        profiles.map(async (profile) => {
          console.log(`useUsersAndRoles: Fetching roles for user ${profile.id} (${profile.email})`);
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*, almacenes(*)')
            .eq('user_id', profile.id);
            
          if (rolesError) {
            console.error(`Error fetching roles for user ${profile.id}:`, rolesError);
            throw rolesError;
          }
          
          console.log(`useUsersAndRoles: Found ${roles?.length || 0} roles for user ${profile.id}`);
          
          return {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name,
            created_at: profile.created_at,
            roles: roles ? roles.map(role => ({
              ...role,
              created_at: role.created_at || new Date().toISOString(),
              almacen_nombre: role.almacenes?.nombre || null
            })) : []
          };
        })
      );
      
      console.log(`useUsersAndRoles: Successfully processed ${usersWithRoles.length} users with their roles`);
      
      // Ordenar usuarios: primero los que tienen roles, luego el resto
      const sortedUsers = [...usersWithRoles].sort((a, b) => {
        // Primero por si tienen roles (los que tienen roles primero)
        if (b.roles.length !== a.roles.length) {
          return b.roles.length - a.roles.length;
        }
        // Luego por nombre completo si existe
        if (a.full_name && b.full_name) {
          return a.full_name.localeCompare(b.full_name);
        }
        // Finalmente por email
        return a.email.localeCompare(b.email);
      });
      
      setUsers(sortedUsers);
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
    await deleteRole(roleId, fetchUsers);
  };

  // Wrapper para asegurar que se actualiza la lista después de añadir rol
  const handleAddRole = async (userId: string, roleName: "admin" | "manager" | "sales" | "viewer", almacenId?: string) => {
    // Implementation would go here
    await fetchUsers();
  };

  // Wrapper para asegurar que se actualiza la lista después de eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId, fetchUsers);
  };

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
