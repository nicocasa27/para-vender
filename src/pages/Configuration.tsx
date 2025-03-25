
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/users/UserManagement";
import { useAuth } from "@/contexts/auth";

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
