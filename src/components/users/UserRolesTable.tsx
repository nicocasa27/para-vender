
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
import { RefreshCw, Users, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { UserRoleForm } from "./UserRoleForm";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  console.log("UserRolesTable rendering with users:", users.length);
  
  // Handler para eliminar rol y luego refrescar
  const handleDeleteRole = async (roleId: string) => {
    await onDeleteRole(roleId);
    // No necesitamos llamar a onRefresh aquí porque ya lo hace onDeleteRole
  };
  
  const handleAddRole = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setSelectedUser(null);
    setIsDialogOpen(false);
  };
  
  const handleSuccess = () => {
    onRefresh();
    handleDialogClose();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // For profile page showing just roles
  if (roles.length > 0) {
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
                  ×
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // For user management page showing users with their roles
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No hay usuarios registrados en el sistema</p>
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
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="w-[150px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">
                  {user.full_name || "Usuario sin nombre"}
                  {!user.email && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <AlertTriangle 
                              size={16} 
                              className="inline ml-1 text-amber-500" 
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Usuario sin email
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </TableCell>
              <TableCell>
                {user.roles && user.roles.length > 0 ? (
                  <UserRolesList
                    roles={user.roles}
                    isLoading={loading}
                    onRoleUpdated={onRefresh}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Sin roles
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRole(user)}
                  >
                    Asignar rol
                  </Button>
                  {user.roles && user.roles.length > 0 && (
                    <div className="flex gap-1">
                      {user.roles.map((role) => (
                        <Button
                          key={role.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          title="Eliminar rol"
                        >
                          ×
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Dialog for adding roles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogTitle>Asignar Rol</DialogTitle>
          {selectedUser && (
            <UserRoleForm 
              selectedUser={selectedUser}
              onSuccess={handleSuccess}
              onCancel={handleDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
