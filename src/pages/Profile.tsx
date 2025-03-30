
import { useEffect, useState } from "react";
import { RoleWithStore } from "@/hooks/users/types/userManagementTypes";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/auth";

export default function Profile() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Remove the argument as useUserRoles doesn't accept any
  const { roles: userRoles, loading: loadingRoles, fetchRoles } = useUserRoles();

  useEffect(() => {
    // Call fetchRoles to get user-specific roles if needed
    const loadRoles = async () => {
      if (user) {
        await fetchRoles();
      }
    };
    
    loadRoles();
  }, [user, fetchRoles]);

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
        onRefresh={fetchRoles} // Use the fetchRoles function for refresh
      />
    </div>
  );
}
