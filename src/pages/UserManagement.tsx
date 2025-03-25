
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { UserCreateForm } from "@/components/users/UserCreateForm";
import { toast } from "sonner";
import { AccessDenied } from "@/components/users/AccessDenied";
import { UserManagementPanel } from "@/components/users/UserManagementPanel";

export default function UserManagement() {
  const { hasRole, signUp } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  if (!hasRole("admin")) {
    return <AccessDenied />;
  }

  const handleCreateUser = async (userData: { email: string; password: string; fullName: string }) => {
    try {
      setIsCreatingUser(true);
      await signUp(userData.email, userData.password, userData.fullName);
      setIsDialogOpen(false);
      
      toast.success("Usuario creado correctamente");
      
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      toast.error("Error al crear usuario", {
        description: error.message || "Ha ocurrido un error al crear el usuario"
      });
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
        <div>
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

      {/* Usamos el panel simplificado de gestión de usuarios */}
      <UserManagementPanel />
    </div>
  );
}
