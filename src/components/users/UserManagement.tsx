
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Users } from "lucide-react";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { useAuth } from "@/contexts/auth";
import { UserSidePanel } from "@/components/users/UserSidePanel";
import { UserWithRoles } from "@/types/auth";
import { toast } from "sonner";

export function UserManagement() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  
  const { 
    users, 
    loading, 
    fetchUsers, 
    deleteRole,
    addRole,
    deleteUser
  } = useUsersAndRoles(isAdmin);

  useEffect(() => {
    if (isAdmin) {
      console.log("UserManagement: Componente montado, cargando usuarios");
    } else {
      console.log("UserManagement: Usuario no es administrador");
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    console.log("UserManagement: Actualizando lista de usuarios");
    toast.info("Actualizando lista de usuarios...");
    fetchUsers();
  };

  const handleAddRole = (user: UserWithRoles) => {
    console.log("Añadir rol a usuario:", user);
    setSidePanelOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Acceso restringido</h3>
        <p className="text-muted-foreground">
          Necesitas permisos de administrador para gestionar usuarios
        </p>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra usuarios y sus roles en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setSidePanelOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Gestionar Usuarios
          </Button>
        </div>
      </div>

      <div className="text-center p-10 border rounded-md">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Panel de Gestión de Usuarios</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Haz clic en el botón "Gestionar Usuarios" para abrir el panel lateral donde 
          podrás ver y administrar todos los usuarios del sistema y sus roles.
        </p>
        <Button onClick={() => setSidePanelOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Abrir Panel de Usuarios
        </Button>
      </div>

      <UserSidePanel
        open={sidePanelOpen}
        onOpenChange={setSidePanelOpen}
        users={users}
        loading={loading}
        onRefresh={handleRefresh}
        onDeleteRole={deleteRole}
        onAddRole={handleAddRole}
      />
    </Card>
  );
}
