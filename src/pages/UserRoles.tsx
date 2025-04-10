
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { Button } from "@/components/ui/button";
import { RefreshCw, Shield } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { useEffect } from "react";

const UserRoles = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    deleteRole,
    addRole
  } = useUsersAndRoles(isAdmin);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUsers();
    console.log("UserRoles component mounted, fetching users...");
  }, [fetchUsers]);

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      console.log("Manual refresh triggered");
      await fetchUsers();
      toast.success("Datos de usuarios actualizados correctamente");
    } catch (err) {
      console.error("Error during refresh:", err);
      toast.error("Error al actualizar datos de usuarios");
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    try {
      console.log("Deleting role:", roleId);
      await deleteRole(roleId);
      // No need to call fetchUsers since deleteRole internally refreshes the data
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol");
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          <h2 className="text-lg font-semibold">Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" /> 
            Roles de Usuario
          </h1>
          <p className="text-muted-foreground">
            Gestione los permisos y roles de los usuarios del sistema.
          </p>
        </div>
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
      </div>

      {error ? (
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          <p className="font-medium">Error al cargar los usuarios</p>
          <p className="text-sm">{typeof error === 'object' ? (error as Error).message : String(error)}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <UserRolesTable
          users={users} 
          loading={loading}
          onDeleteRole={handleDeleteRole}
          onRefresh={handleRefresh}
        />
      )}

      <div className="text-xs text-muted-foreground mt-2">
        Total de usuarios cargados: {users.length}
      </div>
    </div>
  );
};

export default UserRoles;
