import { Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { UserRole } from "@/types/auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  requiredRole?: UserRole;
  storeId?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole,
  storeId 
}) => {
  const { user, loading: authLoading, hasRole, userRoles } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const { toast: uiToast } = useToast();
  
  const isUsersRoute = useMatch("/users");
  const isConfigRoute = useMatch("/config");
  
  const effectiveRequiredRole = 
    isUsersRoute ? "admin" : 
    isConfigRoute ? "manager" : 
    requiredRole;
  
  useEffect(() => {
    setIsAuthorized(null);
    setAuthCheckComplete(false);
    setTimeoutReached(false);
    
    console.log("ProtectedRoute: Checking authorization for role:", effectiveRequiredRole);
    console.log("ProtectedRoute: Auth loading state:", authLoading);
    console.log("ProtectedRoute: Current user roles:", userRoles);
    console.log("ProtectedRoute: Current path:", location.pathname);
    
    const longWaitTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        setTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check is taking longer than expected");
        toast.info("La verificación está tardando más de lo esperado", {
          duration: 5000
        });
      }
    }, 1500);
    
    const authCheckTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.log("ProtectedRoute: Auth check timed out after 5s, continuing with available information");
        
        if (!user) {
          console.log("ProtectedRoute: No user found after timeout");
          setIsAuthorized(false);
          toast.error("No se pudo verificar tu sesión", {
            description: "Por favor inicia sesión nuevamente."
          });
        } else if (userRoles.length === 0) {
          console.log("ProtectedRoute: No roles found after timeout");
          setIsAuthorized(false);
          uiToast({
            title: "Error de autorización",
            description: "No se pudieron cargar tus permisos. Contacta al administrador.",
            variant: "destructive",
          });
        } else {
          const hasRequiredRole = effectiveRequiredRole ? hasRole(effectiveRequiredRole, storeId) : true;
          console.log(`ProtectedRoute: After timeout - user has role ${effectiveRequiredRole}?`, hasRequiredRole);
          setIsAuthorized(hasRequiredRole);
          
          if (!hasRequiredRole) {
            toast.error("Acceso denegado", {
              description: "No tienes los permisos necesarios para acceder a esta página"
            });
          }
        }
        
        setAuthCheckComplete(true);
      }
    }, 5000);
    
    if (!authLoading) {
      if (user) {
        if (effectiveRequiredRole) {
          setTimeout(() => {
            const authorized = hasRole(effectiveRequiredRole, storeId);
            console.log(`ProtectedRoute: User has role ${effectiveRequiredRole}?`, authorized);
            console.log("ProtectedRoute: User roles available:", userRoles);
            
            setIsAuthorized(authorized);
            
            if (!authorized) {
              console.log("ProtectedRoute: Access denied - user doesn't have required role");
              toast.error("Acceso denegado", {
                description: "No tienes los permisos necesarios para acceder a esta página"
              });
            }
            
            setAuthCheckComplete(true);
          }, 100);
        } else {
          console.log("ProtectedRoute: No specific role required, access granted");
          setIsAuthorized(true);
          setAuthCheckComplete(true);
        }
      } else {
        console.log("ProtectedRoute: No user found, redirect to auth");
        setIsAuthorized(false);
        setAuthCheckComplete(true);
      }
    } else {
      console.log("ProtectedRoute: Auth still loading, waiting...");
    }
    
    return () => {
      clearTimeout(authCheckTimeout);
      clearTimeout(longWaitTimeout);
    };
  }, [authLoading, user, effectiveRequiredRole, storeId, hasRole, userRoles, location.pathname]);

  if ((authLoading || !authCheckComplete) && !timeoutReached) {
    console.log("ProtectedRoute: Still loading authentication state");
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

  if (!user) {
    console.log("ProtectedRoute: User not authenticated, redirecting to /auth");
    toast.error("Sesión no válida", {
      description: "Debes iniciar sesión para acceder a esta página"
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (isAuthorized === null && !authCheckComplete) {
    console.log("ProtectedRoute: Still checking permissions");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {timeoutReached 
              ? "Verificando permisos, esto está tardando más de lo esperado..." 
              : "Verificando permisos..."}
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    console.log("ProtectedRoute: User not authorized, redirecting to /unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location, requiredRole: effectiveRequiredRole }} replace />;
  }

  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
