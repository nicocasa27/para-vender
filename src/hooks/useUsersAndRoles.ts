
import { useFetchUsers } from './users/useFetchUsers';
import { useRoleManagement } from './users/useRoleManagement';
import { useUserDeletion } from './users/useUserDeletion';

export function useUsersAndRoles(isAdmin: boolean) {
  // Obtener usuarios
  const { users, loading, error, fetchUsers } = useFetchUsers(isAdmin);
  
  // Gestión de roles
  const { deleteRole } = useRoleManagement();
  
  // Eliminación de usuarios
  const { deleteUser } = useUserDeletion();

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
