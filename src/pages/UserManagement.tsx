
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { UserCreateForm } from "@/components/users/UserCreateForm";
import { NewUserList } from "@/components/users/NewUserList";
import { useNewUserManagement } from "@/hooks/useNewUserManagement";
import { AccessDenied } from "@/components/users/AccessDenied";
import { useState } from "react";

export default function UserManagement() {
  const { hasRole, user, signUp } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const {
    users,
    isLoading,
    refetch,
    handleDeleteRole
  } = useNewUserManagement(user, hasRole("admin"));

  if (!hasRole("admin")) {
    return <AccessDenied />;
  }

  const handleCreateUser = async (userData: { email: string; password: string; fullName: string }) => {
    try {
      setIsCreatingUser(true);
      await signUp(userData.email, userData.password, userData.fullName);
      setIsDialogOpen(false);
      
      // Dar tiempo a que se ejecuten los triggers de Supabase
      setTimeout(() => {
        refetch();
        setTimeout(refetch, 3000); // Segunda recarga por si acaso
      }, 2000);
      
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administre usuarios y asigne roles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Cargando..." : "Actualizar"}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <UserCreateForm
              onCreateUser={handleCreateUser}
              onCancel={() => setIsDialogOpen(false)}
              isCreating={isCreatingUser}
            />
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados ({users.length})</CardTitle>
          <CardDescription>
            Lista de usuarios y sus roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewUserList
            users={users}
            isLoading={isLoading}
            onDeleteRole={handleDeleteRole}
            onSuccess={async () => {
              await refetch();
              return;
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
