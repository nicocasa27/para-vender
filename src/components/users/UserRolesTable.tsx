
import { UserWithRoles, RoleWithStore } from "@/hooks/users/types/userManagementTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserRolesList } from "@/components/profile/UserRolesList";
import { RefreshCw, Users, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserRolesTableProps {
  users?: UserWithRoles[];
  roles?: RoleWithStore[];
  loading: boolean;
  onDeleteRole: (roleId: string) => void;
  onRefresh: () => void;
}

export function UserRolesTable({
  users = [],
  roles = [],
  loading,
  onDeleteRole,
  onRefresh,
}: UserRolesTableProps) {
  // Handler para eliminar rol y luego refrescar
  const handleDeleteRole = async (roleId: string) => {
    await onDeleteRole(roleId);
    // No necesitamos llamar a onRefresh aquí porque ya lo hace el onDeleteRole
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // For profile page showing just roles
  if (roles && roles.length > 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Almacén</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.role}</TableCell>
              <TableCell>{role.almacen_nombre || "Global"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRole(role.id)}
                  title="Eliminar rol"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // For user management page showing users with their roles
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No hay usuarios con roles asignados</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          className="mt-4"
        >
          Intentar cargar usuarios
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">{user.full_name || "Usuario sin nombre"}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </TableCell>
              <TableCell>
                {user.roles && user.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge 
                        key={role.id} 
                        variant={role.role === 'admin' ? 'destructive' : 
                              role.role === 'manager' ? 'default' : 
                              role.role === 'sales' ? 'outline' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {role.role}
                        {role.almacen_nombre && (
                          <span className="ml-1 text-xs opacity-80">
                            ({role.almacen_nombre})
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleDeleteRole(role.id)}
                          title="Eliminar rol"
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Sin roles
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  title="Actualizar roles"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
