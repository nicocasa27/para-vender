
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
    if (!loading && user) {
      if (requiredRole) {
        setIsAuthorized(hasRole(requiredRole, storeId));
      } else {
        setIsAuthorized(true); // No specific role required
      }
    } else if (!loading && !user) {
      setIsAuthorized(false);
    }
  }, [loading, user, requiredRole, storeId, hasRole, userRoles]);

  // Still loading auth state or checking permissions
  if (loading || isAuthorized === null) {
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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Not authorized
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required permissions
  return <Outlet />;
};
