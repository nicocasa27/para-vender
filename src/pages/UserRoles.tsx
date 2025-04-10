
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { Button } from "@/components/ui/button";
import { RefreshCw, Shield, Trash2, UsersRound, SyncIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { useEffect } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { UserWithRoles } from "@/types/auth";
import { useSyncUsers } from "@/hooks/users/useSyncUsers";

const UserRoles = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    deleteRole,
    addRole,
    deleteUser
  } = useUsersAndRoles(isAdmin);

  const { syncUsers, syncing } = useSyncUsers();

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

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      console.log("Deleting user:", userToDelete.id);
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  // Handle user synchronization
  const handleSyncUsers = async () => {
    try {
      await syncUsers();
      await fetchUsers(); // Refresh the list after sync
    } catch (error) {
      console.error("Error en sincronización:", error);
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncUsers}
            disabled={syncing || loading}
            className="flex items-center gap-2"
          >
            <SyncIcon className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar usuarios"}
          </Button>
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
          onDeleteRole={deleteRole}
          onRefresh={handleRefresh}
          onDeleteUser={(user) => setUserToDelete(user)}
        />
      )}

      <div className="text-xs text-muted-foreground mt-2">
        Total de usuarios cargados: {users.length}
      </div>

      {/* Diálogo de confirmación para eliminar usuario */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al usuario <strong>{userToDelete?.full_name || userToDelete?.email}</strong> y todos sus roles asociados. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserRoles;
