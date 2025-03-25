
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
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [longTimeoutReached, setLongTimeoutReached] = useState(false);
  const [roleRefreshAttempts, setRoleRefreshAttempts] = useState(0);
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
    setLongTimeoutReached(false);
    
    console.log("ProtectedRoute: Checking authorization for role:", effectiveRequiredRole);
    console.log("ProtectedRoute: Auth loading state:", authLoading);
    console.log("ProtectedRoute: Roles loading state:", rolesLoading);
    console.log("ProtectedRoute: Current user roles:", userRoles);
    console.log("ProtectedRoute: Current path:", location.pathname);
    console.log("ProtectedRoute: Session exists:", !!session);

    const longWaitTimeout = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check is taking longer than expected");
        toast.info("La verificación está tardando más de lo esperado", {
          duration: 5000
        });
      }
    }, 1500);
    
    const veryLongWaitTimeout = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setLongTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check is taking MUCH longer than expected");
        
        // Force refresh roles one more time if we've waited too long
        if (user && roleRefreshAttempts < 3) {
          console.log("ProtectedRoute: Forcing role refresh due to long timeout");
          setRoleRefreshAttempts(prev => prev + 1);
          refreshUserRoles(true).then(() => {
            if (isMounted) {
              // Manually trigger authorization check after forced refresh
              checkAuthorization();
            }
          });
        }
      }
    }, 3500);
    
    // If roles are empty but user is authenticated, try refreshing the roles
    if (user && session && userRoles.length === 0 && !rolesLoading && !authLoading && roleRefreshAttempts < 3) {
      console.log("ProtectedRoute: User authenticated but no roles found. Refreshing roles...");
      setRoleRefreshAttempts(prev => prev + 1);
      refreshUserRoles(true)
        .then(refreshedRoles => {
          console.log("ProtectedRoute: Roles refreshed:", refreshedRoles);
          if (isMounted && refreshedRoles.length > 0) {
            // If we got roles, check authorization again
            checkAuthorization();
          }
        })
        .catch(error => {
          console.error("ProtectedRoute: Error refreshing roles:", error);
        });
    }
    
    // Don't complete authorization check until auth loading is done
    if (authLoading) {
      console.log("ProtectedRoute: Auth still loading, waiting...");
      return () => {
        isMounted = false;
        clearTimeout(longWaitTimeout);
        clearTimeout(veryLongWaitTimeout);
      };
    }
    
    // Now check authorization with current state
    const checkAuthorization = () => {
      if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to /auth");
        setIsAuthorized(false);
        setAuthCheckComplete(true);
        return;
      }
      
      // Log session state for debugging
      console.log("ProtectedRoute: Session during authorization check:", 
        session ? "Valid" : "Missing", 
        session?.expires_at ? `(expires: ${new Date(session.expires_at * 1000).toISOString()})` : ""
      );
      
      if (effectiveRequiredRole) {
        const authorized = hasRole(effectiveRequiredRole, storeId);
        console.log(`ProtectedRoute: User has role ${effectiveRequiredRole}?`, authorized);
        console.log("ProtectedRoute: User roles available during check:", userRoles);
        
        setIsAuthorized(authorized);
        
        if (!authorized && userRoles.length === 0 && roleRefreshAttempts < 3) {
          // We might need to try refreshing roles again
          console.log("ProtectedRoute: Authorization failed but roles are empty, might need another refresh");
          setAuthCheckComplete(false);
        } else {
          setAuthCheckComplete(true);
          
          if (!authorized) {
            console.log("ProtectedRoute: Access denied - user doesn't have required role");
            if (userRoles.length > 0) {
              toast.error("Acceso denegado", {
                description: "No tienes los permisos necesarios para acceder a esta página"
              });
            }
          }
        }
      } else {
        console.log("ProtectedRoute: No specific role required, access granted");
        setIsAuthorized(true);
        setAuthCheckComplete(true);
      }
    };
    
    // Small delay to ensure all state updates have propagated
    setTimeout(checkAuthorization, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(longWaitTimeout);
      clearTimeout(veryLongWaitTimeout);
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
    refreshUserRoles,
    roleRefreshAttempts,
    session
  ]);

  // Show loading state if authentication or roles are still being loaded
  if ((authLoading || rolesLoading || !authCheckComplete) && !longTimeoutReached) {
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

  // If we waited a very long time and still don't have a definitive authorization,
  // allow access and let the component-level permissions handle it
  if (longTimeoutReached && isAuthorized === null && user) {
    console.log("ProtectedRoute: Authorization timed out but user is authenticated, allowing access");
    toast.warning("Verificación de permisos incompleta", {
      description: "Los permisos no se pudieron verificar completamente, algunas funciones podrían no estar disponibles"
    });
    return <Outlet />;
  }

  if (isAuthorized === false) {
    console.log("ProtectedRoute: User not authorized, redirecting to /unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location, requiredRole: effectiveRequiredRole }} replace />;
  }

  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
