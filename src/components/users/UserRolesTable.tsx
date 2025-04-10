
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
import { RefreshCw, Users, AlertTriangle, Building, Shield, Trash2, UserX } from "lucide-react";
import { useState } from "react";
import { UserRoleForm } from "./UserRoleForm";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface UserRolesTableProps {
  users?: UserWithRoles[];
  roles?: RoleWithStore[];
  loading: boolean;
  onDeleteRole: (roleId: string) => Promise<void>;
  onRefresh: () => void;
  onDeleteUser?: (user: UserWithRoles) => void;
}

export function UserRolesTable({
  users = [],
  roles = [],
  loading,
  onDeleteRole,
  onRefresh,
  onDeleteUser,
}: UserRolesTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Handler para eliminar rol
  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este rol?")) {
      await onDeleteRole(roleId);
    }
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

  // Determina si un rol es predeterminado (generado dinámicamente)
  const isDefaultRole = (roleId: string) => {
    return roleId.startsWith('default-viewer-');
  };

  // Obtiene un emoji o ícono por tipo de rol
  const getRoleBadgeVariant = (roleName: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (roleName) {
      case 'admin': return 'destructive';
      case 'manager': return 'outline';
      case 'sales': return 'default';
      case 'viewer': return 'secondary';
      default: return 'default';
    }
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
              <TableCell>
                <Badge variant={getRoleBadgeVariant(role.role)} className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {role.role}
                </Badge>
              </TableCell>
              <TableCell>{role.almacen_nombre || "Global"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRole(role.id)}
                  title="Eliminar rol"
                  disabled={isDefaultRole(role.id)}
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
            <TableHead className="w-[200px]">Acciones</TableHead>
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
                <div className="flex flex-wrap gap-2">
                  {user.roles.map(role => (
                    <Badge 
                      key={role.id}
                      variant={getRoleBadgeVariant(role.role)}
                      className="flex items-center gap-1"
                    >
                      {role.role === 'admin' && <Shield className="h-3 w-3" />}
                      {role.role === 'sales' && <Building className="h-3 w-3" />}
                      {role.role}
                      {role.almacen_nombre && ` (${role.almacen_nombre})`}
                      {!isDefaultRole(role.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <span className="sr-only">Eliminar rol</span>
                          ×
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
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
                  
                  {onDeleteUser && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteUser(user)}
                      title="Eliminar usuario"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
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
