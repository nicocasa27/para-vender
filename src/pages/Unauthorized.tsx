
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <Shield className="h-20 w-20 text-muted-foreground mx-auto" />
        <h1 className="text-3xl font-bold tracking-tight">Acceso no autorizado</h1>
        <p className="text-lg text-muted-foreground">
          No tiene los permisos necesarios para acceder a esta página.
          Contacte al administrador si cree que esto es un error.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
