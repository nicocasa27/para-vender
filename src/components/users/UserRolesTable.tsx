
import { Badge } from "@/components/ui/badge";
import { UserRoleWithStore } from "@/hooks/users/types/userManagementTypes";

interface UserRolesTableProps {
  roles: UserRoleWithStore[];
  onDeleteRole: (roleId: string) => Promise<void>;
  loading?: boolean;
}

export default function UserRolesTable({ roles, onDeleteRole, loading }: UserRolesTableProps) {
  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div key={role.id} className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
          <div className="flex flex-col">
            <span className="font-medium capitalize">{role.role}</span>
            <span className="text-xs text-muted-foreground">
              {role.almacen_nombre || role.almacenes?.nombre || "Global"}
            </span>
          </div>
          <button
            onClick={() => onDeleteRole(role.id)}
            disabled={loading}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
