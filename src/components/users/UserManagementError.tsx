
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface UserManagementErrorProps {
  onRetry: () => void;
}

export function UserManagementError({ onRetry }: UserManagementErrorProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administre usuarios y asigne roles
          </p>
        </div>
        <Button onClick={onRetry}>Reintentar</Button>
      </div>
      
      <Card className="bg-destructive/10">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-destructive">Error al cargar usuarios</h3>
            <p className="text-muted-foreground mt-2">
              No se pudieron cargar los datos de usuarios. Por favor, intente nuevamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
