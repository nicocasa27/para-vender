import { useEffect, useState } from "react";
import { UserRoleWithStore } from "@/hooks/users/types/userManagementTypes";
import UserRolesTable from "@/components/users/UserRolesTable";
import { getUserRolesByUserId } from "@/hooks/users/api/userDataApi";

export default function Profile() {
  const [roles, setRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      setLoading(true);
      const userId = "some-id"; // Reemplaza por el user actual
      const fetchedRoles = await getUserRolesByUserId(userId);
      setRoles(fetchedRoles);
      setLoading(false);
    };

    loadRoles();
  }, []);

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
