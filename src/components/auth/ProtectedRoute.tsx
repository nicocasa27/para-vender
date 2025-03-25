
import { Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { UserRole } from "@/types/auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const { toast: uiToast } = useToast();
  
  const isUsersRoute = useMatch("/users");
  const isConfigRoute = useMatch("/config");
  
  const effectiveRequiredRole = 
    isUsersRoute ? "admin" : 
    isConfigRoute ? "manager" : 
    requiredRole;
  
  // Function to force a role refresh and retry authorization
  const forceRoleRefresh = async () => {
    if (!user) return;
    
    console.log("ProtectedRoute: Forcing role refresh");
    setRoleRefreshAttempts(prev => prev + 1);
    try {
      const refreshedRoles = await refreshUserRoles();
      console.log("ProtectedRoute: Roles refreshed:", refreshedRoles);
      // Re-check authorization with the new roles
      checkAuthorization();
    } catch (error) {
      console.error("ProtectedRoute: Error refreshing roles:", error);
      // Mark auth check as complete even if refresh failed
      setAuthCheckComplete(true);
    }
  };
  
  // Function to check authorization status
  const checkAuthorization = () => {
    // Don't check authorization if we're still loading roles or auth
    if (rolesLoading || authLoading) {
      console.log("ProtectedRoute: Still loading, deferring authorization check");
      return;
    }
    
    if (!user) {
      console.log("ProtectedRoute: No user found, unauthorized");
      setIsAuthorized(false);
      setAuthCheckComplete(true);
      return;
    }
    
    console.log("ProtectedRoute: Checking authorization for user:", user.id);
    console.log("ProtectedRoute: Session state:", session ? "Valid" : "Missing");
    console.log("ProtectedRoute: Required role:", effectiveRequiredRole);
    console.log("ProtectedRoute: Current roles:", userRoles);
    
    if (effectiveRequiredRole) {
      const authorized = hasRole(effectiveRequiredRole, storeId);
      console.log(`ProtectedRoute: User has role ${effectiveRequiredRole}?`, authorized);
      
      if (authorized) {
        console.log("ProtectedRoute: User is authorized");
        setIsAuthorized(true);
        setAuthCheckComplete(true);
      } else if (userRoles.length === 0 && roleRefreshAttempts < 3 && !maxAttemptsReached) {
        // No roles found, but we haven't exhausted our refresh attempts
        console.log("ProtectedRoute: No roles found but attempts remain, will retry");
        setIsAuthorized(null); // Keep authorization pending
        
        // Only continue trying to refresh if we haven't exceeded the limit
        if (roleRefreshAttempts < 3) {
          forceRoleRefresh();
        }
      } else {
        // User doesn't have the required role or we've exhausted retries
        console.log("ProtectedRoute: User is not authorized or retries exhausted");
        setIsAuthorized(false);
        setAuthCheckComplete(true);
        
        // Only show error if roles are loaded and we know authorization actually failed
        if (userRoles.length > 0) {
          toast.error("Acceso denegado", {
            description: "No tienes los permisos necesarios para acceder a esta página"
          });
        }
      }
    } else {
      // No specific role required
      console.log("ProtectedRoute: No specific role required, access granted");
      setIsAuthorized(true);
      setAuthCheckComplete(true);
    }
  };
  
  useEffect(() => {
    let isMounted = true;
    setTimeoutReached(false);
    setLongTimeoutReached(false);
    
    console.log("ProtectedRoute: Initializing authorization check");
    console.log("ProtectedRoute: Auth loading:", authLoading);
    console.log("ProtectedRoute: Roles loading:", rolesLoading);
    console.log("ProtectedRoute: Current path:", location.pathname);
    
    // Set up timeouts for loading indicators
    const timeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check taking longer than expected");
      }
    }, 1500);
    
    const longTimeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        setLongTimeoutReached(true);
        console.log("ProtectedRoute: Authorization check taking much longer than expected");
        
        // Force a role refresh if we've waited too long and we're under the max attempts
        if (user && roleRefreshAttempts < 3 && !maxAttemptsReached) {
          forceRoleRefresh();
        } else if (roleRefreshAttempts >= 3) {
          // We've tried enough times, mark as complete and break the loop
          setMaxAttemptsReached(true);
          setAuthCheckComplete(true);
          console.log("ProtectedRoute: Max attempts reached, breaking the infinite loop");
          
          // For really long timeouts, just proceed with current authorization state
          if (userRoles.length > 0) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        }
      }
    }, 3500);
    
    // Add a final timeout to force-break any infinite loops after 8 seconds
    const emergencyTimeoutTimer = setTimeout(() => {
      if (isMounted && !authCheckComplete) {
        console.log("ProtectedRoute: EMERGENCY TIMEOUT - Breaking infinite loop");
        setMaxAttemptsReached(true);
        setAuthCheckComplete(true);
        
        // If we have a user, give them the benefit of the doubt
        if (user) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      }
    }, 8000);
    
    // If we have a user but no roles, try to refresh roles
    if (user && session && userRoles.length === 0 && !rolesLoading && !authLoading && roleRefreshAttempts < 3 && !maxAttemptsReached) {
      console.log("ProtectedRoute: User authenticated but no roles, refreshing");
      forceRoleRefresh();
    } else if (!authLoading && !rolesLoading) {
      // Only check authorization when both auth and roles are done loading
      console.log("ProtectedRoute: Ready to check authorization");
      setTimeout(checkAuthorization, 100); // Small delay to ensure state is settled
    } else {
      // Still loading either auth or roles, do not check authorization yet
      console.log("ProtectedRoute: Still loading auth or roles, deferring authorization check");
    }
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      clearTimeout(longTimeoutTimer);
      clearTimeout(emergencyTimeoutTimer);
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
    roleRefreshAttempts,
    session,
    maxAttemptsReached
  ]);

  // If max attempts reached and still loading, just show a final error
  if (maxAttemptsReached && !authCheckComplete) {
    console.log("ProtectedRoute: Max attempts reached, forcing authorization decision");
    setAuthCheckComplete(true);
    
    // If we have a user, give them access as fallback
    if (user) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }

  // Always show loading state while roles are being loaded or auth check is incomplete
  if (authLoading || (rolesLoading && roleRefreshAttempts < 3) || (isAuthorized === null && !authCheckComplete && !maxAttemptsReached)) {
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
              disabled={rolesLoading || roleRefreshAttempts >= 3}
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
                setIsAuthorized(true);
                setAuthCheckComplete(true);
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

  // Handle unauthorized users - only redirect if we've completed authorization check
  if (isAuthorized === false && authCheckComplete) {
    console.log("ProtectedRoute: User not authorized, redirecting to unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location, requiredRole: effectiveRequiredRole }} replace />;
  }

  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
