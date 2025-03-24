
import { Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, loading, hasRole, userRoles } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const { toast: uiToast } = useToast();
  
  // Check if we're on a route that requires special permissions
  const isUsersRoute = useMatch("/users");
  const isConfigRoute = useMatch("/config");
  
  // Determine the required role based on the current route
  const effectiveRequiredRole = 
    isUsersRoute ? "admin" : 
    isConfigRoute ? "manager" : 
    requiredRole;
  
  useEffect(() => {
    // Reset states when route or required role changes
    setIsAuthorized(null);
    setAuthCheckComplete(false);
    setTimeoutReached(false);
    
    console.log("ProtectedRoute: Checking authorization for role:", effectiveRequiredRole);
    
    // Add a shorter timeout to show "taking longer than expected" message
    const longWaitTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        setTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check is taking longer than expected");
        toast("La verificación está tardando más de lo esperado");
      }
    }, 1500); // 1.5 second notification
    
    // Add a timeout to prevent infinite loading
    const authCheckTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.log("ProtectedRoute: Auth check timed out, continuing with available information");
        
        // If timeout is reached and still not authorized, redirect to appropriate page
        if (!user) {
          setIsAuthorized(false);
          toast.error("No se pudo verificar tu sesión. Por favor inicia sesión nuevamente.");
        } else if (userRoles.length === 0) {
          setIsAuthorized(false);
          uiToast({
            title: "Error de autorización",
            description: "No se pudieron cargar tus permisos. Contacta al administrador.",
            variant: "destructive",
          });
        } else {
          // Make a best-effort attempt with available information
          const hasRequiredRole = effectiveRequiredRole ? hasRole(effectiveRequiredRole, storeId) : true;
          setIsAuthorized(hasRequiredRole);
          
          if (!hasRequiredRole) {
            toast.error("No tienes los permisos necesarios para acceder a esta página");
          }
        }
        
        setAuthCheckComplete(true);
      }
    }, 3000); // 3 second hard timeout
    
    // Only check authorization when user and roles are loaded
    if (!loading) {
      if (user) {
        if (effectiveRequiredRole) {
          const authorized = hasRole(effectiveRequiredRole, storeId);
          console.log(`ProtectedRoute: User has role ${effectiveRequiredRole}?`, authorized);
          setIsAuthorized(authorized);
          
          if (!authorized) {
            toast.error("No tienes los permisos necesarios para acceder a esta página");
          }
        } else {
          setIsAuthorized(true); // No specific role required
        }
      } else {
        console.log("ProtectedRoute: No user found, redirect to auth");
        setIsAuthorized(false);
      }
      setAuthCheckComplete(true);
    }
    
    return () => {
      clearTimeout(authCheckTimeout);
      clearTimeout(longWaitTimeout);
    };
  }, [loading, user, effectiveRequiredRole, storeId, hasRole, userRoles, location.pathname]);

  // Still loading auth state - but with a timeout to prevent infinite loading
  if (loading && !authCheckComplete) {
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

  // Not authenticated
  if (!user) {
    console.log("ProtectedRoute: User not authenticated, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Checking permissions
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

  // Not authorized
  if (isAuthorized === false) {
    console.log("ProtectedRoute: User not authorized, redirecting to /unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required permissions
  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
