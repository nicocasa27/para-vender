
import { UserRoleWithStore } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Key } from "lucide-react";

interface UserRolesListProps {
  roles: UserRoleWithStore[];
  isLoading: boolean;
}

export function UserRolesList({ roles, isLoading }: UserRolesListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="h-5 w-5 animate-spin mx-auto mb-2 rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Cargando roles...</p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground font-medium">
          No tienes roles asignados
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Contacta a un administrador para obtener permisos de acceso
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role, idx) => (
        <Badge key={idx} variant={role.role === 'admin' ? 'default' : 'outline'} className="flex items-center">
          <Key className="h-3 w-3 mr-1" />
          {role.role}
          {role.almacen_id && (
            <span className="ml-1 text-xs opacity-80">
              ({role.almacen_nombre || role.almacen_id})
            </span>
          )}
        </Badge>
      ))}
    </div>
  );
}
