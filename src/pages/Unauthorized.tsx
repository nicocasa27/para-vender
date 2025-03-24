
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, User, Home, LogOut, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const { user, signOut } = useAuth();

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
            Su cuenta no tiene los privilegios necesarios para acceder a este recurso.
          </AlertDescription>
        </Alert>
        
        {user ? (
          <div className="bg-muted/50 rounded-lg p-4 text-left text-sm">
            <p className="font-medium mb-2">Su cuenta actual:</p>
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4" /> 
              <span>{user.email}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Necesita permisos adicionales para acceder a esta sección.
            </p>
          </div>
        ) : null}
        
        <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          
          {user ? (
            <Button onClick={signOut} variant="outline">
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
