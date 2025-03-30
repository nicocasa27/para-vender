
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/hooks/users/types/userManagementTypes";

interface UserRolesTableProps {
  roles: UserRole[];
  loading: boolean;
  onDeleteRole?: (id: string) => void;
}

export default function UserRolesTable({ roles, loading, onDeleteRole }: UserRolesTableProps) {
  // Function to render a readable role name
  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      "admin": "Administrador",
      "manager": "Gerente",
      "employee": "Empleado",
      "visitante": "Visitante"
    };
    
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="rounded-md border animate-pulse">
        <div className="h-24 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando roles de usuario...</p>
        </div>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="h-24 flex items-center justify-center">
          <p className="text-muted-foreground">No hay roles asignados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <Badge variant="outline" className="capitalize font-medium">
                  {getRoleName(role.role)}
                </Badge>
              </TableCell>
              <TableCell>{role.almacen_nombre || (role.almacenes?.nombre) || "Global"}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{role.full_name || "Sin nombre"}</span>
                  <span className="text-xs text-muted-foreground">{role.email || "Sin email"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {onDeleteRole && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteRole(role.id)}
                  >
                    Eliminar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
