
import { Navigate, Outlet, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { useEffect, useState } from "react";

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
  
  // Check if we're on a route that requires special permissions
  const isUsersRoute = useMatch("/users");
  const isConfigRoute = useMatch("/config");
  
  // Determine the required role based on the current route
  const effectiveRequiredRole = 
    isUsersRoute ? "admin" : 
    isConfigRoute ? "manager" : 
    requiredRole;
  
  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const authCheckTimeout = setTimeout(() => {
      if (!authCheckComplete) {
        console.log("ProtectedRoute: Auth check timed out, continuing with available information");
        if (user) {
          setIsAuthorized(true);
        } else if (!loading) {
          setIsAuthorized(false);
        }
        setAuthCheckComplete(true);
      }
    }, 3000); // 3 second timeout
    
    // Only check authorization when user and roles are loaded
    if (!loading) {
      if (user) {
        if (effectiveRequiredRole) {
          setIsAuthorized(hasRole(effectiveRequiredRole, storeId));
        } else {
          setIsAuthorized(true); // No specific role required
        }
      } else {
        setIsAuthorized(false);
      }
      setAuthCheckComplete(true);
    }
    
    return () => clearTimeout(authCheckTimeout);
  }, [loading, user, effectiveRequiredRole, storeId, hasRole, userRoles, authCheckComplete]);

  // Still loading auth state - but with a timeout to prevent infinite loading
  if (loading && !authCheckComplete) {
    console.log("ProtectedRoute: Still loading authentication state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
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
