
import { useEffect, useState } from "react";
import { UserRole } from "@/hooks/users/types/userManagementTypes";
import UserRolesTable from "@/components/users/UserRolesTable";
import { getUserRolesByUserId } from "@/hooks/users/api/userDataApi";
import { useAuth } from "@/contexts/auth";

export default function Profile() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      setLoading(true);
      if (user?.id) {
        const fetchedRoles = await getUserRolesByUserId(user.id);
        setRoles(fetchedRoles);
      }
      setLoading(false);
    };

    loadRoles();
  }, [user]);

  const handleDelete = async (roleId: string) => {
    // lógica para eliminar
    console.log("Eliminar rol con id:", roleId);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Tus Roles</h2>
      <UserRolesTable roles={roles} onDeleteRole={handleDelete} loading={loading} />
    </div>
  );
}
