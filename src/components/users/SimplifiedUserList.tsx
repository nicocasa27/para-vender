
import { UserWithRoles } from "@/types/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { UserRoleBadge } from "./UserRoleBadge";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { UserRoleForm } from "./UserRoleForm";
import { Skeleton } from "@/components/ui/skeleton";

interface SimplifiedUserListProps {
  users: UserWithRoles[];
  isLoading: boolean;
  onDeleteRole: (roleId: string) => Promise<void>;
  onAddRole: (userId: string) => void;
}

export function SimplifiedUserList({ users, isLoading, onDeleteRole, onAddRole }: SimplifiedUserListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-md border">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <h3 className="text-lg font-medium">No hay usuarios registrados</h3>
        <p className="text-muted-foreground mt-2">
          Los usuarios aparecerán aquí cuando se registren
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{user.full_name || "Sin nombre"}</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
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
                      <UserRoleBadge
                        key={role.id}
                        id={role.id}
                        role={role.role as any}
                        storeName={role.almacen_nombre}
                        onDelete={() => onDeleteRole(role.id)}
                      />
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddRole(user.id)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Asignar Rol
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
