import { UserWithRoles } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Trash, User } from "lucide-react";
import { UserRoleBadge } from "./UserRoleBadge";

interface UserManagementContentProps {
  users: UserWithRoles[];
  loading: boolean;
  onDeleteUser: (userId: string) => Promise<void>;
}

export function UserManagementContent({ users, loading, onDeleteUser }: UserManagementContentProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-10">
        <User className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No hay usuarios registrados</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Los usuarios aparecerán aquí cuando se registren
        </p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 font-medium">Usuario</th>
          <th className="text-left py-2 font-medium">Roles</th>
          <th className="text-right py-2 font-medium">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b">
            <td className="py-3">
              <div>
                <div className="font-medium">{user.full_name || "Sin nombre"}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </td>
            <td className="py-3">
              {user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <UserRoleBadge
                      key={role.id}
                      id={role.id}
                      role={role.role as any}
                      storeName={role.almacen_nombre}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Sin roles asignados</span>
              )}
            </td>
            <td className="text-right py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteUser(user.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Eliminar usuario</span>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
