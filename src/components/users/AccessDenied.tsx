
import { Shield } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <Shield className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Acceso restringido</h2>
      <p className="text-muted-foreground">
        Solo los administradores pueden gestionar usuarios.
      </p>
    </div>
  );
}
