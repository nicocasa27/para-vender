
import { UserWithRoles } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, Trash } from "lucide-react";

interface UserRowProps {
  user: UserWithRoles;
  onAddRole: (user: UserWithRoles) => void;
  onDeleteRole: (roleId: string) => void;
}

export function UserRow({ user, onAddRole, onDeleteRole }: UserRowProps) {
  // Log para depurar
  console.log("UserRow props:", { 
    id: user.id,
    email: user.email, 
    full_name: user.full_name,
    roles: user.roles.length
  });

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{user.full_name || "Sin nombre"}</span>
          <span className="text-sm text-muted-foreground">{user.email || "Sin email"}</span>
          {user.created_at && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(user.created_at), "PPP", { locale: es })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {user.roles.length === 0 ? (
            <span className="text-sm text-muted-foreground italic">Sin roles</span>
          ) : (
            user.roles.map(role => (
              <Badge 
                key={role.id}
                variant={role.role === 'admin' ? 'destructive' : 'default'}
                className="flex items-center gap-1"
              >
                {role.role}
                {role.almacen_nombre && ` (${role.almacen_nombre})`}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onDeleteRole(role.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddRole(user)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Asignar Rol
        </Button>
      </TableCell>
    </TableRow>
  );
}
