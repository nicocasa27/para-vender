
import { User, Session } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

interface AccountInfoProps {
  user: User | null;
  session: Session | null;
}

export function AccountInfo({ user, session }: AccountInfoProps) {
  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No hay información de usuario disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Email</p>
        <p>{user.email}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">ID de Usuario</p>
        <p className="font-mono text-sm">{user.id}</p>
      </div>
      {session && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Estado de Sesión</p>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50">Autenticado</Badge>
            {session.expires_at && (
              <span className="text-xs text-muted-foreground">
                Expira: {new Date(session.expires_at * 1000).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
