
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { UserSidePanel } from "@/components/users/UserSidePanel";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { toast } from "sonner";
import { useUserManagementQuery } from "@/hooks/useUserManagementQuery";
import { supabase } from "@/integrations/supabase/client";

export function UserManagement() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  
  // Usar React Query para manejar el estado de carga y actualización de datos
  const { 
    data: users = [], 
    isLoading: loading, 
    refetch 
  } = useUserManagementQuery(user, isAdmin);

  const handleRefresh = async () => {
    console.log("UserManagement: Actualizando lista de usuarios");
    toast.info("Actualizando lista de usuarios...");
    await refetch();
    toast.success("Lista de usuarios actualizada");
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      console.log(`Eliminando rol con ID: ${roleId}`);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      
      // Actualizar la lista de usuarios
      await refetch();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", {
        description: error.message
      });
    }
  };

  const handleAddRole = async (user: UserWithRoles) => {
    setSelectedUser(user);
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
        onDeleteRole={handleDeleteRole}
        onAddRole={handleAddRole}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />
    </Card>
  );
}
