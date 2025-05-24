
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSimpleUserManagement } from "@/hooks/users/useSimpleUserManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield } from "lucide-react";

const UserRoles = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
  const {
    users,
    loading,
    error,
    refetch,
    deleteRole
  } = useSimpleUserManagement(isAdmin);

  const handleRefresh = () => {
    refetch();
  };

  if (!user) {
    return (
      <DashboardLayout title="Gestión de Usuarios">
        <div className="text-center py-8">
          <p>Debes iniciar sesión para acceder a esta página</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout title="Gestión de Usuarios">
        <div className="text-center py-8">
          <Shield className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p>No tienes permisos para acceder a esta página</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión de Usuarios">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios y Roles del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-600 mb-4">
                Error: {error}
              </div>
            )}
            
            <UserRolesTable
              users={users}
              loading={loading}
              onDeleteRole={deleteRole}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserRoles;
