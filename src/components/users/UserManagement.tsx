
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, UserPlus } from "lucide-react";
import { UserList } from "@/components/users/UserList";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { useAuth } from "@/contexts/auth";

export function UserManagement() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
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
    fetchUsers();
  };

  const handleAddRole = (user: any) => {
    // Esto debería abrir un diálogo para seleccionar el rol
    console.log("Añadir rol a usuario:", user);
    // Por ahora simplemente asignamos un rol viewer
    addRole(user.id, 'viewer');
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
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <UserList 
        users={users} 
        isLoading={loading} 
        onDeleteRole={deleteRole}
        onAddRole={handleAddRole}
      />
    </Card>
  );
}
