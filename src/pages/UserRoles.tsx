
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { Button } from "@/components/ui/button";
import { RefreshCw, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { UserSidePanel } from "@/components/users/UserSidePanel";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";

const UserRoles = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    deleteRole 
  } = useUsersAndRoles(isAdmin);

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log("UserRoles: Cargando usuarios y roles al montar componente");
    fetchUsers();
  }, [fetchUsers]);

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      console.log("UserRoles: Actualizando usuarios y roles manualmente");
      await fetchUsers();
      toast.success("Roles actualizados correctamente");
    } catch (err) {
      console.error("Error al actualizar roles:", err);
      toast.error("Error al actualizar roles");
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    try {
      console.log("UserRoles: Eliminando rol:", roleId);
      await deleteRole(roleId);
      // Refrescar la lista después de eliminar
      console.log("UserRoles: Refrescando lista después de eliminar rol");
      await fetchUsers();
      toast.success("Rol eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol");
    }
  };

  // Handle add role
  const handleAddRole = (user: UserWithRoles) => {
    console.log("UserRoles: Abriendo diálogo para asignar rol a:", user.email);
    setSelectedUser(user);
    setSidebarOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles de Usuario</h1>
          <p className="text-muted-foreground">
            Gestione los permisos y roles de los usuarios del sistema.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2"
          >
            <UsersRound className="h-4 w-4" />
            Gestionar Usuarios
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          <p className="font-medium">Error al cargar los usuarios</p>
          <p className="text-sm">{typeof error === 'object' ? (error as Error).message : String(error)}</p>
        </div>
      ) : (
        <UserRolesTable
          users={users} 
          loading={loading}
          onDeleteRole={handleDeleteRole}
          onRefresh={handleRefresh}
        />
      )}

      <UserSidePanel
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        users={users}
        loading={loading}
        onRefresh={fetchUsers}
        onDeleteRole={handleDeleteRole}
        onAddRole={handleAddRole}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />
    </div>
  );
};

export default UserRoles;
