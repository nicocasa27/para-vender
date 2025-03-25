
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { UserWithRoles } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Trash, UserPlus, RefreshCw, User, AlertTriangle } from "lucide-react";
import { UserRoleBadge } from "./UserRoleBadge";
import { toast } from "sonner";
import { UserCreateForm } from "./UserCreateForm";

export function UserManagementPanel() {
  const { getAllUsers, deleteUser, signUp, hasRole, refreshUserRoles } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const loadUsers = async () => {
    try {
      console.log("UserManagementPanel: Cargando usuarios...");
      setLoading(true);
      const data = await getAllUsers();
      console.log("UserManagementPanel: Usuarios cargados:", data.length);
      setUsers(data);
    } catch (error: any) {
      console.error("UserManagementPanel: Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios", {
        description: error.message || "No se pudieron cargar los usuarios",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      try {
        console.log("UserManagementPanel: Eliminando usuario:", userId);
        const success = await deleteUser(userId);
        
        if (success) {
          console.log("UserManagementPanel: Usuario eliminado correctamente");
          toast.success("Usuario eliminado", {
            description: "El usuario ha sido eliminado correctamente",
          });
          // Refrescar la lista después de eliminar
          await loadUsers();
        }
      } catch (error) {
        console.error("UserManagementPanel: Error al eliminar usuario:", error);
      }
    }
  };

  const handleCreateUser = async (userData: { email: string; password: string; fullName: string }) => {
    try {
      setIsCreating(true);
      
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
      
      setOpen(false);
      
      // Esperar un momento para que Supabase procese el nuevo usuario y luego recargar
      setTimeout(async () => {
        console.log("UserManagementPanel: Recargando usuarios después de crear uno nuevo");
        await loadUsers();
      }, 1500);
      
    } catch (error: any) {
      console.error("UserManagementPanel: Error al crear usuario:", error);
      toast.error("Error al crear usuario", {
        description: error.message || "No se pudo crear el usuario",
      });
    } finally {
      setIsCreating(false);
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUsers} 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Cargando..." : "Actualizar"}</span>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <UserCreateForm 
                onCreateUser={handleCreateUser}
                onCancel={() => setOpen(false)}
                isCreating={isCreating}
              />
            </Dialog>
          </div>
        </CardTitle>
        <CardDescription>
          Gestione los usuarios del sistema, cree nuevos usuarios o elimine existentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay usuarios registrados</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Los usuarios aparecerán aquí cuando se registren
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Usuario</th>
                <th className="text-left py-2 font-medium">Roles</th>
                <th className="text-right py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{user.full_name || "Sin nombre"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-3">
                    {user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <UserRoleBadge
                            key={role.id}
                            id={role.id}
                            role={role.role as any}
                            storeName={role.almacen_nombre}
                            onDelete={() => {}}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin roles asignados</span>
                    )}
                  </td>
                  <td className="text-right py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Eliminar usuario</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
