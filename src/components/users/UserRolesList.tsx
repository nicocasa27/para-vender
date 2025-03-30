
import { useEffect, useState } from "react";
import { Role, RoleWithStore } from "@/hooks/users/types/userManagementTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserRolesListProps {
  roles: RoleWithStore[];
  onDeleteRole?: (roleId: string) => void;
}

export function UserRolesList({ roles, onDeleteRole }: UserRolesListProps) {
  // Estado local para mantener un registro de los roles
  const [userRoles, setUserRoles] = useState<RoleWithStore[]>([]);

  // Actualizar el estado local cuando cambien los props
  useEffect(() => {
    setUserRoles(roles);
  }, [roles]);

  // Verificar si un rol es predeterminado (generado dinámicamente)
  const isDefaultRole = (roleId: string) => {
    return roleId.startsWith('default-viewer-');
  };

  // Obtener el color de la insignia según el rol
  const getBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'outline';
      case 'sales':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {userRoles.map((role) => (
        <div key={role.id} className="flex items-center">
          <Badge 
            variant={getBadgeVariant(role.role)}
            className="flex items-center gap-1 mr-1"
          >
            {role.role}
            {role.almacen_nombre && ` (${role.almacen_nombre})`}
            
            {onDeleteRole && !isDefaultRole(role.id) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDeleteRole(role.id)}
                      className="ml-1 text-xs hover:bg-opacity-20 hover:bg-background rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar rol</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default UserRolesList;
