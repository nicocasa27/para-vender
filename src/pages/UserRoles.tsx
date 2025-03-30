
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@/hooks/users/types/userManagementTypes";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserCreateForm } from "@/components/users/UserCreateForm";
import { UserRoleForm } from "@/components/users/UserRoleForm";
import { Skeleton } from "@/components/ui/skeleton";

const UserRoles: React.FC = () => {
  const { roles, loading } = useUserRoles();
  
  // Si no tenemos acceso a estas propiedades en useUserRoles, definimos defaults
  const isLoadingRoles = loading;
  const isLoadingStores = loading;
  
  // Funciones mock si no están disponibles
  const deleteRole = (roleId: string) => {
    console.log("Deleting role", roleId);
    // Implementación real debería venir de useUserRoles
  };
  
  const refreshRoles = () => {
    console.log("Refreshing roles");
    // Implementación real debería venir de useUserRoles
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roles de Usuario</h2>
          <p className="text-muted-foreground">
            Gestione los roles y permisos de los usuarios en el sistema
          </p>
        </div>
        <Button onClick={refreshRoles}>Actualizar</Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles Actuales</TabsTrigger>
          <TabsTrigger value="new">Asignar Nuevo Rol</TabsTrigger>
          <TabsTrigger value="create">Crear Usuario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Roles Asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : roles && roles.length > 0 ? (
                <UserRolesTable 
                  roles={roles} 
                  onDelete={deleteRole} 
                  isLoading={isLoadingRoles || isLoadingStores} 
                />
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No hay roles asignados a usuarios todavía
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Asignar Rol a Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <UserRoleForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCreateForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="text-sm text-muted-foreground">
        <p>
          Los cambios en los roles de usuario pueden tardar unos minutos en propagarse
          a todos los sistemas.
        </p>
      </div>
    </div>
  );
};

export default UserRoles;
