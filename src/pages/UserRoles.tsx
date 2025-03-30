import { useUserRoles } from "@/hooks/useUserRoles";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function UserRoles() {
  const { users, loading, loadUsers } = useUserRoles(true); // Asume admin

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuarios y Roles</h1>
          <p className="text-muted-foreground">Gestión de acceso por rol y sucursal</p>
        </div>
        <Button
          variant="outline"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <UserRolesTable
        users={users}
        loading={loading}
        onRefresh={loadUsers}
      />
    </div>
  );
}
