import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

export interface SideNavProps {
  className?: string;
}

export function SideNav({ className }: SideNavProps) {
  const { pathname } = useLocation();
  const { hasRole } = useAuth();

  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <ScrollArea className="flex-1 px-3">
        <div className="mb-4">
          <Link to="/">
            <Button variant="ghost" className="justify-start w-full">
              Dashboard
            </Button>
          </Link>
        </div>
        <div className="space-y-1">
          {(isAdmin || isManager || hasRole('sales') || hasRole('viewer')) && (
            <Link to="/inventory">
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full",
                  pathname.startsWith("/inventory")
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : ""
                )}
              >
                Inventario
              </Button>
            </Link>
          )}
          {(isAdmin || isManager || hasRole('viewer')) && (
            <Link to="/analytics">
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full",
                  pathname.startsWith("/analytics")
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : ""
                )}
              >
                Analíticas
              </Button>
            </Link>
          )}
          {(isAdmin || isManager) && (
            <Link to="/admin">
              <Button
                variant="ghost"
                className={cn(
                  "justify-start w-full",
                  pathname.startsWith("/admin")
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : ""
                )}
              >
                Administración
              </Button>
            </Link>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
