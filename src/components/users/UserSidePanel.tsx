
import { useState } from "react";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Props {
  selectedUser?: UserWithRoles;
  user?: UserWithRoles;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

const UserSidePanel = ({ selectedUser, user, onSuccess, onCancel }: Props) => {
  const [activeTab, setActiveTab] = useState("roles");
  
  // Use whichever user prop is provided
  const activeUser = selectedUser || user;

  return (
    <Sheet open={!!activeUser} onOpenChange={() => onCancel()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestionar Usuario</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <div className="mb-6 space-y-1">
            <h3 className="font-medium">{activeUser?.full_name || "Usuario"}</h3>
            <p className="text-sm text-muted-foreground">{activeUser?.email}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="roles" className="flex-1">Roles</TabsTrigger>
              <TabsTrigger value="permissions" className="flex-1">Permisos</TabsTrigger>
              <TabsTrigger value="info" className="flex-1">Información</TabsTrigger>
            </TabsList>
            
            <TabsContent value="roles" className="mt-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Roles Actuales</h4>
                
                {activeUser?.roles && activeUser.roles.length > 0 ? (
                  <div className="space-y-2">
                    {activeUser.roles.map(role => (
                      <div key={role.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium capitalize">{role.role}</p>
                          {role.almacen_nombre && (
                            <p className="text-xs text-muted-foreground">{role.almacen_nombre}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Revocar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Este usuario no tiene roles asignados.</p>
                )}
                
                <Button className="w-full mt-4">Añadir Rol</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="permissions" className="mt-4">
              <p className="text-sm text-muted-foreground">
                La gestión de permisos estará disponible próximamente.
              </p>
            </TabsContent>
            
            <TabsContent value="info" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">ID</h4>
                  <p className="text-sm mt-1">{activeUser?.id}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Email</h4>
                  <p className="text-sm mt-1">{activeUser?.email}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Nombre</h4>
                  <p className="text-sm mt-1">{activeUser?.full_name || "No especificado"}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserSidePanel;
