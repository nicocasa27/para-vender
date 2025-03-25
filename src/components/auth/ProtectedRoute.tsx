
import { Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { UserRole } from "@/types/auth";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthorization } from "@/hooks/auth/useAuthorization";

interface ProtectedRouteProps {
  requiredRole?: UserRole;
  storeId?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole,
  storeId 
}) => {
  const { 
    user, 
    loading: authLoading, 
    rolesLoading, 
    hasRole, 
    userRoles, 
    refreshUserRoles,
    session
  } = useAuth();
  
  const location = useLocation();
  const isUsersRoute = Boolean(useMatch("/users"));
  const isConfigRoute = Boolean(useMatch("/config"));
  
  // Determinar el rol requerido basado en la ruta o el prop proporcionado
  const effectiveRequiredRole = 
    isUsersRoute ? "admin" : 
    isConfigRoute ? "manager" : 
    requiredRole;
  
  console.log("ProtectedRoute: Route check", {
    path: location.pathname,
    isUsersRoute,
    isConfigRoute,
    providedRole: requiredRole,
    effectiveRole: effectiveRequiredRole,
    userRoles: userRoles.map(r => r.role),
    isAdmin: userRoles.some(r => r.role === 'admin')
  });
  
  const {
    isAuthorized,
    authCheckComplete,
    timeoutReached,
    longTimeoutReached,
    maxAttemptsReached,
    forceRoleRefresh
  } = useAuthorization(
    effectiveRequiredRole, 
    {
      user,
      hasRole,
      userRoles,
      rolesLoading,
      session,
      refreshUserRoles
    },
    storeId
  );

  // Always show loading state while auth is loading or auth check is incomplete
  if (authLoading || (rolesLoading && !maxAttemptsReached) || (isAuthorized === null && !authCheckComplete && !maxAttemptsReached)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {timeoutReached 
              ? "Verificando permisos, esto está tardando más de lo esperado..." 
              : "Verificando autenticación..."}
          </p>
        </div>
      </div>
    );
  }
  
  // Very long wait screen with manual retry option - only show if we're still waiting after long timeout
  if (longTimeoutReached && isAuthorized === null && user && !maxAttemptsReached) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">Verificación de permisos incompleta</h2>
          <p className="text-muted-foreground">
            La verificación está tomando más tiempo de lo esperado. Esto puede suceder si el servidor está
            ocupado o hay problemas de conexión.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={forceRoleRefresh} 
              disabled={rolesLoading}
            >
              {rolesLoading ? "Intentando..." : "Reintentar verificación"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Allow access but with warning
                toast.warning("Verificación incompleta", {
                  description: "Algunas funciones podrían no estar disponibles"
                });
              }}
            >
              Continuar de todos modos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (!user) {
    console.log("ProtectedRoute: No authenticated user, redirecting to login");
    toast.error("Sesión no válida", {
      description: "Debes iniciar sesión para acceder a esta página"
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Comprobación específica para rol de administrador
  const isAdmin = userRoles.some(r => r.role === 'admin');
  if (isAdmin && effectiveRequiredRole) {
    console.log("ProtectedRoute: User is admin, bypassing role check for:", effectiveRequiredRole);
    return <Outlet />;
  }

  // Handle unauthorized users - only redirect if we've completed authorization check
  if (isAuthorized === false && authCheckComplete) {
    console.log("ProtectedRoute: User not authorized, redirecting to unauthorized", { 
      requiredRole: effectiveRequiredRole,
      userRoles: userRoles.map(r => r.role),
      storeId
    });
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location, 
          requiredRole: effectiveRequiredRole || "viewer", // Asegurar que siempre hay un valor para requiredRole
          path: location.pathname 
        }} 
        replace 
      />
    );
  }

  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
