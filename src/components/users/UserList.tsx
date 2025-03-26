
import { UserWithRoles } from "@/types/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRoleBadge } from "./UserRoleBadge";
import { memo } from "react";

interface UserListProps {
  users: UserWithRoles[];
  isLoading: boolean;
  onDeleteRole: (roleId: string) => void;
  onAddRole: (user: UserWithRoles) => void;
}

// Memoize the component to prevent unnecessary re-renders
export const UserList = memo(function UserList({ users, isLoading, onDeleteRole, onAddRole }: UserListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-10">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No hay usuarios registrados</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Los usuarios aparecerán aquí cuando se registren
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{user.profiles?.full_name || user.full_name || "Sin nombre"}</div>
                  <div className="text-sm text-muted-foreground">{user.profiles?.email || user.email || "Sin email"}</div>
                </div>
              </TableCell>
              <TableCell>
                {user.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <UserRoleBadge
                        key={role.id}
                        id={role.id}
                        role={role.role}
                        storeName={role.almacen_nombre}
                        onDelete={onDeleteRole}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Sin roles asignados</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddRole(user)}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="sr-only">Asignar rol</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
