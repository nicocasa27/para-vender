
import { UserManagementPanel } from "@/components/users/UserManagementPanel";
import { useAuth } from "@/contexts/auth";

export default function Profile() {
  const { user, hasRole } = useAuth();

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu información y preferencias
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Información Personal</h2>
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID de Usuario</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </div>
        </div>

        {hasRole("admin") && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Administración</h2>
            <UserManagementPanel />
          </div>
        )}
      </div>
    </div>
  );
}
