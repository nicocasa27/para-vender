import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, User, Home, LogOut, AlertTriangle, Copy, Check, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Unauthorized() {
  const { user, userRoles, hasRole, refreshUserRoles, signOut, rolesLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [requiredRole, setRequiredRole] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<any>(null);
  const location = useLocation();

  useState(() => {
    const state = location.state as { requiredRole?: string } | undefined;
    if (state?.requiredRole) {
      setRequiredRole(state.requiredRole);
    }
    
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthDetails(data.session);
    };
    
    checkAuthStatus();
  });

  const getDebugInfo = () => {
    const info = {
      user: user ? {
        id: user.id,
        email: user.email,
        auth_provider: user.app_metadata?.provider || "unknown",
        created_at: user.created_at,
      } : "Not authenticated",
      session: authDetails ? {
        expires_at: authDetails.expires_at,
        auth_token_type: authDetails.token_type,
      } : "No session",
      userRoles: userRoles.map(role => ({
        role: role.role,
        store: role.almacen_nombre || "(global)",
        storeId: role.almacen_id || "none",
        roleId: role.id
      })),
      requiredRole: requiredRole || "Unknown",
      timestamp: new Date().toISOString(),
      path: location.pathname,
      referrer: location.state?.from?.pathname || "Unknown",
    };
    
    return JSON.stringify(info, null, 2);
  };

  const copyToClipboard = () => {
    const debugInfo = getDebugInfo();
    navigator.clipboard.writeText(debugInfo)
      .then(() => {
        setCopied(true);
        toast.success("Información copiada al portapapeles");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Error al copiar al portapapeles:", err);
        toast.error("Error al copiar información");
      });
  };

  const handleRefreshRoles = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await refreshUserRoles();
      toast.success("Roles actualizados");
    } catch (error) {
      toast.error("Error al actualizar roles");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <Shield className="h-20 w-20 text-destructive mx-auto" />
        <h1 className="text-3xl font-bold tracking-tight">Acceso no autorizado</h1>
        <p className="text-lg text-muted-foreground">
          No tiene los permisos necesarios para acceder a esta página.
          Contacte al administrador si cree que esto es un error.
        </p>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de permisos</AlertTitle>
          <AlertDescription>
            {requiredRole ? (
              <span>Su cuenta no tiene el rol <strong>{requiredRole}</strong> necesario para acceder a este recurso.</span>
            ) : (
              <span>Su cuenta no tiene los privilegios necesarios para acceder a este recurso.</span>
            )}
          </AlertDescription>
        </Alert>
        
        {user ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Información de cuenta</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> 
                <span>{user.email}</span>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">Sus roles actuales:</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefreshRoles}
                    disabled={refreshing || rolesLoading}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing || rolesLoading ? 'animate-spin' : ''}`} />
                    {refreshing || rolesLoading ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userRoles.length > 0 ? (
                    userRoles.map((role, index) => (
                      <Badge key={index} variant="outline" className="bg-muted/50">
                        {role.role}
                        {role.almacen_nombre && (
                          <span className="ml-1 text-xs opacity-70">
                            ({role.almacen_nombre})
                          </span>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {rolesLoading ? "Cargando roles..." : "No tiene roles asignados"}
                    </span>
                  )}
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="debug">
                  <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-2">
                    Información para soporte técnico
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-60">
                      {getDebugInfo()}
                    </pre>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 text-xs" 
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar información para soporte
                        </>
                      )}
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex justify-center border-t pt-4">
              Es posible que necesite cerrar sesión e iniciar sesión nuevamente para refrescar sus roles.
            </CardFooter>
          </Card>
        ) : null}
        
        <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          
          {user ? (
            <Button 
              onClick={handleSignOut} 
              variant="outline"
              disabled={loggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth">
                <LogOut className="mr-2 h-4 w-4" />
                Iniciar sesión
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
