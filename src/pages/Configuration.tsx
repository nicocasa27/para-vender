
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/users/UserManagement";
import { useAuth } from "@/contexts/auth";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Configuration() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la configuración del sistema
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="stores">Almacenes</TabsTrigger>
          <TabsTrigger value="settings">Preferencias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <div className="mb-4">
            <Link to="/user-roles">
              <Button variant="outline" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Nueva gestión de roles
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              Hemos implementado una nueva página dedicada a la gestión de roles.
            </p>
          </div>
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="stores" className="mt-6">
          <div className="p-6 bg-muted rounded-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Gestión de Almacenes</h3>
            <p className="text-muted-foreground">
              Esta funcionalidad estará disponible próximamente
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <div className="p-6 bg-muted rounded-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Preferencias del Sistema</h3>
            <p className="text-muted-foreground">
              Esta funcionalidad estará disponible próximamente
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
