================
import { UserWithRoles } from "@/types/auth";
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
import { RefreshCw, Users } from "lucide-react";

interface UserRolesTableProps {
  users: UserWithRoles[];
  loading: boolean;
  onDeleteRole: (roleId: string) => void;
  onRefresh: () => void; // ✅ ya integrado acá
}

export function UserRolesTable({
  users,
  loading,
  onDeleteRole,
  onRefresh, // ✅ usado más abajo
}: UserRolesTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No hay usuarios con roles asignados</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead className="w-[100px]">Acciones</TableHead>
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
              {user.roles.length > 0 ? (
                <UserRolesList
                  roles={user.roles}
                  isLoading={loading}
                  onRoleUpdated={onRefresh} // ✅ Aquí está la magia
                />
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  Sin roles
                </span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {user.roles.map((role) => (
                  <Button
                    key={role.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteRole(role.id)}
                    title="Eliminar rol"
                  >
                    ×
                  </Button>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
