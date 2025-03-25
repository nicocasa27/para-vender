
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserCog, AlertTriangle } from "lucide-react";
import { SimplifiedUserList } from "./SimplifiedUserList";
import { useDirectUserFetch } from "@/hooks/useDirectUserFetch";
import { Dialog } from "@/components/ui/dialog";
import { UserRoleForm } from "./UserRoleForm";
import { UserWithRoles } from "@/types/auth";
import { toast } from "sonner";

export function UserManagementPanel() {
  const { users, isLoading, error, refetch, handleDeleteRole } = useDirectUserFetch();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleRefresh = async () => {
    toast.info("Actualizando lista de usuarios...");
    await refetch();
    toast.success("Lista de usuarios actualizada");
  };

  const handleAddRole = (userId: string) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error al cargar usuarios
          </CardTitle>
          <CardDescription>
            No se pudieron obtener los usuarios desde Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar nuevamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription>
            {isLoading ? "Cargando usuarios..." : `${users.length} usuarios registrados`}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Cargando..." : "Actualizar"}
        </Button>
      </CardHeader>
      <CardContent>
        <SimplifiedUserList
          users={users}
          isLoading={isLoading}
          onDeleteRole={handleDeleteRole}
          onAddRole={handleAddRole}
        />

        <Dialog open={isDialogOpen && !!selectedUser} onOpenChange={setIsDialogOpen}>
          {selectedUser && (
            <UserRoleForm
              selectedUser={selectedUser}
              onSuccess={async () => {
                await refetch();
                setIsDialogOpen(false);
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
