
import { Badge } from "@/components/ui/badge";

interface AccessPermissionsProps {
  hasRole: (role: string, storeId?: string) => boolean;
}

export function AccessPermissions({ hasRole }: AccessPermissionsProps) {
  const permissions = [
    { role: 'admin', label: 'Administración' },
    { role: 'manager', label: 'Gestión' },
    { role: 'sales', label: 'Ventas' },
    { role: 'viewer', label: 'Visualización' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {permissions.map((permission) => (
        <div key={permission.role} className="flex items-center">
          <Badge 
            variant={hasRole(permission.role) ? 'default' : 'secondary'} 
            className="mr-2"
          >
            {hasRole(permission.role) ? 'Permitido' : 'No permitido'}
          </Badge>
          {permission.label}
        </div>
      ))}
    </div>
  );
}
