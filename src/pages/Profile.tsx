
import { UserManagementPanel } from "@/components/users/UserManagementPanel";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserIcon, Shield, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, hasRole, userRoles, refreshUserRoles, rolesLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshRoles = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const roles = await refreshUserRoles(true);
      toast.success(
        roles.length > 0 
          ? "Roles actualizados correctamente" 
          : "No se encontraron roles asignados"
      );
    } catch (error) {
      console.error("Error refreshing roles:", error);
      toast.error("Error al actualizar roles");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu información y preferencias
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Información Personal</h2>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <UserIcon className="mr-2 h-5 w-5" />
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID de Usuario</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Roles y Permisos
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshRoles}
                  disabled={refreshing || rolesLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing || rolesLoading ? 'animate-spin' : ''}`} />
                  {refreshing || rolesLoading ? 'Actualizando...' : 'Actualizar roles'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {userRoles.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tus roles asignados:</p>
                    <div className="flex flex-wrap gap-2">
                      {userRoles.map((role, idx) => (
                        <Badge key={idx} variant={role.role === 'admin' ? 'default' : 'outline'} className="flex items-center">
                          <Key className="h-3 w-3 mr-1" />
                          {role.role}
                          {role.almacen_id && (
                            <span className="ml-1 text-xs opacity-80">
                              ({role.almacen_nombre || role.almacen_id})
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Acceso a funcionalidades:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Badge variant={hasRole('admin') ? 'default' : 'secondary'} className="mr-2">
                          {hasRole('admin') ? 'Permitido' : 'No permitido'}
                        </Badge>
                        Administración
                      </div>
                      <div className="flex items-center">
                        <Badge variant={hasRole('manager') ? 'default' : 'secondary'} className="mr-2">
                          {hasRole('manager') ? 'Permitido' : 'No permitido'}
                        </Badge>
                        Gestión
                      </div>
                      <div className="flex items-center">
                        <Badge variant={hasRole('sales') ? 'default' : 'secondary'} className="mr-2">
                          {hasRole('sales') ? 'Permitido' : 'No permitido'}
                        </Badge>
                        Ventas
                      </div>
                      <div className="flex items-center">
                        <Badge variant={hasRole('viewer') ? 'default' : 'secondary'} className="mr-2">
                          {hasRole('viewer') ? 'Permitido' : 'No permitido'}
                        </Badge>
                        Visualización
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    {rolesLoading 
                      ? "Cargando roles..." 
                      : "No tienes roles asignados. Contacta a un administrador."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {hasRole("admin") && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Administración</h2>
            <UserManagementPanel />
          </div>
        )}
      </div>
    </div>
  );
}
