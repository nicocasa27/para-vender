
import { Navigate, Outlet, useLocation } from "react-router-dom";
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
  
  useEffect(() => {
    // Only check authorization when user and roles are loaded
    if (!loading) {
      if (user) {
        if (requiredRole) {
          setIsAuthorized(hasRole(requiredRole, storeId));
        } else {
          setIsAuthorized(true); // No specific role required
        }
      } else {
        setIsAuthorized(false);
      }
    }
  }, [loading, user, requiredRole, storeId, hasRole, userRoles]);

  // Still loading auth state
  if (loading) {
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
  if (isAuthorized === null) {
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
  if (!isAuthorized) {
    console.log("ProtectedRoute: User not authorized, redirecting to /unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required permissions
  console.log("ProtectedRoute: User is authenticated and authorized");
  return <Outlet />;
};
