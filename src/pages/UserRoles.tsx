
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
    deleteRole 
  } = useUsersAndRoles(isAdmin);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      await fetchUsers();
      toast.success("Roles actualizados correctamente");
    } catch (err) {
      toast.error("Error al actualizar roles");
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      // Refrescar la lista después de eliminar
      fetchUsers();
    } catch (error) {
      console.error("Error al eliminar rol:", error);
    }
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
        </div>
      ) : (
        <UserRolesTable
          users={users} 
          loading={loading}
          onDeleteRole={handleDeleteRole}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default UserRoles;
