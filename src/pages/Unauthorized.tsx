import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, User, Home, LogOut, AlertTriangle, Copy, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Unauthorized() {
  const { user, userRoles, hasRole } = useAuth();
  const [copied, setCopied] = useState(false);
  const [requiredRole, setRequiredRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { requiredRole?: string } | undefined;
    if (state?.requiredRole) {
      setRequiredRole(state.requiredRole);
    }
  }, [location]);

  const getDebugInfo = () => {
    const info = {
      user: user ? {
        id: user.id,
        email: user.email,
      } : "Not authenticated",
      userRoles: userRoles.map(role => ({
        role: role.role,
        store: role.almacen_nombre || "(global)",
        storeId: role.almacen_id || "none"
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
                <p className="mb-2 font-medium text-sm">Sus roles actuales:</p>
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
                    <span className="text-xs text-muted-foreground">No tiene roles asignados</span>
                  )}
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="debug">
                  <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-2">
                    Información para soporte técnico
                  </AccordionTrigger>
                  <AccordionContent>
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
            <Button onClick={() => useAuth().signOut()} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
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
