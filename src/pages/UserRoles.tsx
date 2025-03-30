
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, HelpCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "@/hooks/users/types/userManagementTypes";
import UserRolesTable from "@/components/users/UserRolesTable";
import { useUserRoles } from "@/hooks/useUserRoles";

const UserRoles = () => {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { 
    roles, 
    stores,
    isLoadingRoles,
    isLoadingStores,
    deleteRole,
    refreshRoles
  } = useUserRoles();

  const handleRefresh = async () => {
    await refreshRoles();
    toast.success("Roles actualizados correctamente");
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("¿Está seguro que desea eliminar este rol?")) {
      return;
    }

    try {
      await deleteRole(roleId);
      toast.success("Rol eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando rol:", error);
      toast.error("Error al eliminar el rol");
    }
  };

  const getFilteredRoles = (): UserRole[] => {
    let filteredRoles = roles;

    // Filter by tab
    if (activeTab === "admin") {
      filteredRoles = filteredRoles.filter(role => role.role === "admin");
    } else if (activeTab === "manager") {
      filteredRoles = filteredRoles.filter(role => role.role === "manager");
    } else if (activeTab === "employee") {
      filteredRoles = filteredRoles.filter(role => 
        role.role !== "admin" && role.role !== "manager"
      );
    }

    // Then filter by store
    if (selectedStore) {
      filteredRoles = filteredRoles.filter(role => 
        role.almacen_id === selectedStore
      );
    }

    return filteredRoles;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Roles</h2>
          <p className="text-muted-foreground">
            Administre los roles y permisos de los usuarios
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refrescar</span>
          </Button>
          <Button>
            Asignar Nuevo Rol
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Roles de Usuario</CardTitle>
          
          <div className="flex items-center gap-2">
            <Tabs 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="manager">Gerentes</TabsTrigger>
                <TabsTrigger value="employee">Empleados</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {!isLoadingStores && stores.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    {selectedStore 
                      ? stores.find(store => store.id === selectedStore)?.name || "Sucursal" 
                      : "Todas las sucursales"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setSelectedStore(null)}>
                      Todas las sucursales
                    </DropdownMenuItem>
                    {stores.map(store => (
                      <DropdownMenuItem 
                        key={store.id}
                        onClick={() => setSelectedStore(store.id)}
                      >
                        {store.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <UserRolesTable 
            roles={getFilteredRoles()}
            loading={isLoadingRoles}
            onDeleteRole={handleDeleteRole}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoles;
