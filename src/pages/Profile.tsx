
import { useEffect, useState } from "react";
import { UserRole } from "@/hooks/users/types/userManagementTypes";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/auth";

export default function Profile() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { roles: userRoles, loading: loadingRoles } = useUserRoles(user?.id);

  useEffect(() => {
    setRoles(userRoles);
    setLoading(loadingRoles);
  }, [userRoles, loadingRoles]);

  const handleDelete = async (roleId: string) => {
    // lógica para eliminar
    console.log("Eliminar rol con id:", roleId);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Tus Roles</h2>
      <UserRolesTable 
        roles={roles} 
        onDeleteRole={handleDelete} 
        loading={loading}
        onRefresh={() => {}} // Add empty function to satisfy the prop requirement
      />
    </div>
  );
}
