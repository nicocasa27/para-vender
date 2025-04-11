
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  Store,
  ShoppingCart,
  Users,
  Settings,
  LineChart
} from "lucide-react";
import { useRoleVerification } from "@/contexts/auth/hooks/useRoleVerification";

export type SideNavProps = React.HTMLAttributes<HTMLDivElement>;

export function SideNav({ className, ...props }: SideNavProps) {
  const { hasRole } = useRoleVerification();
  const isAdmin = hasRole('admin');

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xl font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                    : "hover:bg-muted"
                )
              }
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                    : "hover:bg-muted"
                )
              }
            >
              <Store className="h-4 w-4" />
              <span>Inventario</span>
            </NavLink>
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                    : "hover:bg-muted"
                )
              }
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Punto de Venta</span>
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                    : "hover:bg-muted"
                )
              }
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analíticas</span>
            </NavLink>
            <NavLink
              to="/analiticas2"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                    : "hover:bg-muted"
                )
              }
            >
              <LineChart className="h-4 w-4" />
              <span>Analíticas 2</span>
            </NavLink>
          </div>
        </div>
        {isAdmin && (
          <div className="px-4 py-2">
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Administración
            </h2>
            <div className="space-y-1">
              <NavLink
                to="/user-roles"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                    isActive
                      ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                      : "hover:bg-muted"
                  )
                }
              >
                <Users className="h-4 w-4" />
                <span>Usuarios y Roles</span>
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                    isActive
                      ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                      : "hover:bg-muted"
                  )
                }
              >
                <Settings className="h-4 w-4" />
                <span>Mi perfil</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
