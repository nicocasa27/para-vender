import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { getUsersWithRoles } from "@/services/userService";

export default function UserRoles() {
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsersWithRoles() {
      try {
        const users = await getUsersWithRoles();
        const typedUsersWithRoles = users as unknown as UserWithRoles[];
        setUsersWithRoles(typedUsersWithRoles);
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'message' in error) {
          toast.error(error.message);
        } else {
          toast.error("Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsersWithRoles();
  }, []);

  const handleDeleteRole = async (roleId: string) => {
    // Implement role deletion logic here
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const users = await getUsersWithRoles();
      const typedUsersWithRoles = users as unknown as UserWithRoles[];
      setUsersWithRoles(typedUsersWithRoles);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(error.message);
      } else {
        toast.error("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Roles de Usuarios</h1>
      <UserRolesTable
        users={usersWithRoles}
        loading={loading}
        onDeleteRole={handleDeleteRole}
        onRefresh={handleRefresh}
      />
    </div>
  );
}