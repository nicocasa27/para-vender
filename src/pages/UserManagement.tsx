
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { UserWithRoles } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { UserList } from "@/components/users/UserList";
import { UserRoleForm } from "@/components/users/UserRoleForm";
import { AccessDenied } from "@/components/users/AccessDenied";
import { UserManagementError } from "@/components/users/UserManagementError";
import { useUserManagementQuery } from "@/hooks/useUserManagementQuery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function UserManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const { hasRole, user } = useAuth();
  
  // Use the custom hook for data fetching
  const {
    data: users = [],
    isLoading,
    refetch,
    isRefetching,
    error
  } = useUserManagementQuery(user, hasRole("admin"));

  // Refrescar automáticamente al montar
  useState(() => {
    console.log("UserManagement: Página montada, refrescando datos...");
    refetch();
  });

  const handleDeleteRole = async (roleId: string) => {
    try {
      console.log("UserManagement: Eliminando rol:", roleId);
      
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) {
        console.error("UserManagement: Error al eliminar rol:", error);
        throw error;
      }

      toast.success("Rol eliminado", {
        description: "El rol ha sido eliminado correctamente",
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error("Error al eliminar rol", {
        description: error.message || "No se pudo eliminar el rol",
      });
    }
  };

  const showRoleDialog = (user: UserWithRoles) => {
    console.log("UserManagement: Mostrando diálogo de roles para usuario:", user.id);
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Only admin can access this page
  if (!hasRole("admin")) {
    return <AccessDenied />;
  }

  if (error) {
    console.error("UserManagement: Error en la consulta:", error);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Error al cargar usuarios
          </CardTitle>
          <CardDescription>
            No se pudieron cargar los usuarios. Por favor, intente nuevamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar nuevamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administre usuarios y asigne roles
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading || isRefetching} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading || isRefetching ? "animate-spin" : ""}`} />
          {isLoading || isRefetching ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados ({users.length})</CardTitle>
          <CardDescription>
            Lista de usuarios y sus roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserList 
            users={users}
            isLoading={isLoading || isRefetching}
            onDeleteRole={handleDeleteRole}
            onAddRole={showRoleDialog}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedUser && (
          <UserRoleForm 
            selectedUser={selectedUser}
            onSuccess={() => {
              setIsDialogOpen(false);
              refetch();
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
}
