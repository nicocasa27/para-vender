
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, User } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useRoleAssignment } from "@/hooks/useRoleAssignment";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { UserSearchForm } from "@/components/users/UserSearchForm";
import { UserRolesTable } from "@/components/users/UserRolesTable";

export default function UserRoles() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
  // Usar hooks personalizados para separar la lógica
  const { users, loading, loadUsers } = useUserRoles(isAdmin);
  const { deleteRole } = useRoleManagement();
  const { selectedRole, setSelectedRole, assignRole } = useRoleAssignment(loadUsers);
  const { 
    email, 
    setEmail, 
    selectedUser, 
    searchLoading, 
    searchUserByEmail 
  } = useUserSearch();

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <User className="h-4 w-4" />
          <AlertTitle>Acceso restringido</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles</h1>
          <p className="text-muted-foreground">Asigna y gestiona roles de usuarios</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      <UserSearchForm
        email={email}
        setEmail={setEmail}
        selectedUser={selectedUser}
        searchLoading={searchLoading}
        searchUserByEmail={searchUserByEmail}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        assignRole={(userId) => assignRole(userId)}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Usuarios y sus roles</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRolesTable 
            users={users} 
            loading={loading} 
            onDeleteRole={(roleId) => deleteRole(roleId, loadUsers)} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
