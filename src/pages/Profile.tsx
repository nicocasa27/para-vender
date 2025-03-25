
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, UserIcon, Shield, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { UserRolesList } from "@/components/profile/UserRolesList";
import { AccessPermissions } from "@/components/profile/AccessPermissions";
import { AccountInfo } from "@/components/profile/AccountInfo";

export default function Profile() {
  const { user, hasRole, userRoles, refreshUserRoles, rolesLoading, session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<Date | null>(null);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Monitor role status on initial load and set up auto-refresh
  useEffect(() => {
    if (user && !autoRefreshTimer) {
      // Auto refresh roles every 60 seconds
      const timer = setInterval(() => {
        console.log("Profile: Auto-refreshing roles");
        refreshUserRoles(true).catch(error => {
          console.error("Error in auto-refresh:", error);
        });
      }, 60000);
      
      setAutoRefreshTimer(timer);
      
      // Refresh immediately on mount
      if (userRoles.length === 0 && !rolesLoading && !lastRefreshAttempt) {
        console.log("Profile: No roles detected on initial profile load, attempting refresh");
        handleRefreshRoles();
      }
    }
    
    return () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
      }
    };
  }, [user, userRoles, rolesLoading]);

  const handleRefreshRoles = async () => {
    if (!user) return;
    
    setRefreshing(true);
    setLastRefreshAttempt(new Date());
    
    try {
      const roles = await refreshUserRoles(true);
      
      if (roles.length > 0) {
        toast.success("Roles actualizados correctamente");
        console.log("Profile: Roles refreshed successfully:", roles);
      } else {
        toast.warning("No se encontraron roles asignados", {
          description: "Es posible que necesites contactar a un administrador"
        });
        console.warn("Profile: No roles found after refresh");
      }
    } catch (error) {
      console.error("Profile: Error refreshing roles:", error);
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
              <AccountInfo user={user} session={session} />
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
              {rolesLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Cargando roles...</p>
                </div>
              ) : userRoles.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tus roles asignados:</p>
                    <UserRolesList roles={userRoles} isLoading={false} />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Acceso a funcionalidades:</p>
                    <AccessPermissions hasRole={hasRole} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-muted-foreground font-medium">
                    No tienes roles asignados
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contacta a un administrador para obtener permisos de acceso
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={handleRefreshRoles}
                  >
                    Intentar nuevamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
