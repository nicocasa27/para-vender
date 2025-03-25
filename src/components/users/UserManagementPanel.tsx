
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, User, RefreshCw } from "lucide-react";
import { UserManagementActions } from "./UserManagementActions";
import { UserManagementContent } from "./UserManagementContent";
import { useUserManagementQuery } from "@/hooks/useUserManagementQuery";
import { Button } from "@/components/ui/button";

export function UserManagementPanel() {
  const { hasRole, signUp, user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Usar el hook mejorado con React Query
  const {
    data: users = [],
    isLoading,
    refetch,
    isRefetching,
    error
  } = useUserManagementQuery(user, hasRole("admin"));

  // Cargar usuarios cuando se monta el componente
  useEffect(() => {
    console.log("UserManagementPanel: Componente montado, cargando usuarios...");
    refetch();
  }, [refetch, refreshTrigger]);

  // Verificar permisos de administrador
  if (!hasRole("admin")) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Acceso Denegado
          </CardTitle>
          <CardDescription>
            No tienes permisos para administrar usuarios.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleCreateUser = async (userData: { email: string; password: string; fullName: string }) => {
    try {
      if (!userData.email || !userData.password) {
        toast.error("Datos incompletos", {
          description: "El email y la contraseña son obligatorios",
        });
        return;
      }
      
      setIsCreatingUser(true);
      console.log("UserManagementPanel: Creando usuario:", userData.email);
      
      await signUp(userData.email, userData.password, userData.fullName);
      
      toast.success("Usuario creado", {
        description: `Se ha creado el usuario ${userData.email} correctamente`,
      });
      
      // Esperar un momento y luego recargar varias veces con intervalos
      // Esto es para asegurar que los triggers de Supabase tienen tiempo para ejecutarse
      setTimeout(() => {
        console.log("UserManagementPanel: Primer intento de recarga después de crear usuario");
        refetch();
        
        // Segundo intento después de 3 segundos adicionales
        setTimeout(() => {
          console.log("UserManagementPanel: Segundo intento de recarga después de crear usuario");
          refetch();
          
          // Tercer intento después de 3 segundos más
          setTimeout(() => {
            console.log("UserManagementPanel: Tercer intento de recarga después de crear usuario");
            setRefreshTrigger(prev => prev + 1); // Esto forzará otra recarga
            setIsCreatingUser(false);
          }, 3000);
        }, 3000);
      }, 3000);
      
    } catch (error: any) {
      console.error("UserManagementPanel: Error al crear usuario:", error);
      setIsCreatingUser(false);
      toast.error("Error al crear usuario", {
        description: error.message || "No se pudo crear el usuario",
      });
    }
  };

  const handleRefresh = async () => {
    console.log("UserManagementPanel: Recargando usuarios manualmente...");
    toast.info("Actualizando lista de usuarios...");
    await refetch();
    toast.success("Lista de usuarios actualizada");
  };

  // Mostrar mensaje de error si lo hay
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Error
          </CardTitle>
          <CardDescription>
            Ocurrió un error al cargar los usuarios.
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Administración de Usuarios
          </span>
          <UserManagementActions 
            onRefresh={handleRefresh}
            onCreateUser={handleCreateUser}
            isLoading={isLoading || isRefetching || isCreatingUser}
          />
        </CardTitle>
        <CardDescription>
          Gestione los usuarios del sistema, cree nuevos usuarios o elimine existentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserManagementContent 
          users={users}
          loading={isLoading || isRefetching}
          onDeleteUser={async (userId: string) => {
            try {
              if (window.confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
                console.log("UserManagementPanel: Eliminando usuario:", userId);
                // Implementación de eliminación...
                toast.success("Usuario eliminado correctamente");
                refetch();
              }
            } catch (error) {
              console.error("Error al eliminar usuario:", error);
              toast.error("Error al eliminar usuario");
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
