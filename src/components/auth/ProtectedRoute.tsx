
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
  const { user, loading: authLoading, rolesLoading, hasRole, userRoles, refreshUserRoles } = useAuth();
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
    let isMounted = true;
    setTimeoutReached(false);
    
    console.log("ProtectedRoute: Checking authorization for role:", effectiveRequiredRole);
    console.log("ProtectedRoute: Auth loading state:", authLoading);
    console.log("ProtectedRoute: Roles loading state:", rolesLoading);
    console.log("ProtectedRoute: Current user roles:", userRoles);
    console.log("ProtectedRoute: Current path:", location.pathname);

    const longWaitTimeout = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check is taking longer than expected");
        toast.info("La verificación está tardando más de lo esperado", {
          duration: 5000
        });
      }
    }, 1500);
    
    // If roles are empty but user is authenticated, try refreshing the roles once
    if (user && userRoles.length === 0 && !rolesLoading && !authLoading) {
      console.log("ProtectedRoute: User authenticated but no roles found. Refreshing roles...");
      refreshUserRoles()
        .then(refreshedRoles => {
          console.log("ProtectedRoute: Roles refreshed:", refreshedRoles);
        })
        .catch(error => {
          console.error("ProtectedRoute: Error refreshing roles:", error);
        });
    }
    
    // Don't check authorization until user and roles are fully loaded
    if (authLoading || rolesLoading) {
      console.log("ProtectedRoute: Auth or roles still loading, waiting...");
      return () => {
        isMounted = false;
        clearTimeout(longWaitTimeout);
      };
    }
    
    // Now that loading is complete, check authorization
    const checkAuthorization = () => {
      if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to /auth");
        setIsAuthorized(false);
        setAuthCheckComplete(true);
        return;
      }
      
      if (effectiveRequiredRole) {
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
      } else {
        console.log("ProtectedRoute: No specific role required, access granted");
        setIsAuthorized(true);
      }
      
      setAuthCheckComplete(true);
    };
    
    // Small delay to ensure all state updates have propagated
    setTimeout(checkAuthorization, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(longWaitTimeout);
    };
  }, [
    authLoading, 
    rolesLoading, 
    user, 
    effectiveRequiredRole, 
    storeId, 
    hasRole, 
    userRoles, 
    location.pathname, 
    refreshUserRoles
  ]);

  // Show loading state if authentication or roles are still being loaded
  if ((authLoading || rolesLoading || !authCheckComplete) && !timeoutReached) {
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

  if (isAuthorized === false) {
    console.log("ProtectedRoute: User not authorized, redirecting to /unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location, requiredRole: effectiveRequiredRole }} replace />;
  }

  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
