
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, User } from "lucide-react";
import { UserManagementActions } from "./UserManagementActions";
import { UserManagementContent } from "./UserManagementContent";
import { useUserManagement } from "@/hooks/useUserManagement";

export function UserManagementPanel() {
  const { hasRole, signUp } = useAuth();
  const { users, loading, loadUsers, handleDeleteUser } = useUserManagement();

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

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
      
      console.log("UserManagementPanel: Creando usuario:", userData.email);
      await signUp(userData.email, userData.password, userData.fullName);
      
      toast.success("Usuario creado", {
        description: `Se ha creado el usuario ${userData.email} correctamente`,
      });
      
      // Esperar un momento para que Supabase procese el nuevo usuario y luego recargar
      setTimeout(async () => {
        console.log("UserManagementPanel: Recargando usuarios después de crear uno nuevo");
        await loadUsers();
      }, 3000);
      
    } catch (error: any) {
      console.error("UserManagementPanel: Error al crear usuario:", error);
      toast.error("Error al crear usuario", {
        description: error.message || "No se pudo crear el usuario",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Administración de Usuarios
          </span>
          <UserManagementActions 
            onRefresh={loadUsers}
            onCreateUser={handleCreateUser}
            isLoading={loading}
          />
        </CardTitle>
        <CardDescription>
          Gestione los usuarios del sistema, cree nuevos usuarios o elimine existentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserManagementContent 
          users={users}
          loading={loading}
          onDeleteUser={handleDeleteUser}
        />
      </CardContent>
    </Card>
  );
}
