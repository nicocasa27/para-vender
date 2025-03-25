
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { UserWithRoles } from "@/types/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Shield, RefreshCw } from "lucide-react";
import { UserList } from "@/components/users/UserList";
import { UserRoleForm } from "@/components/users/UserRoleForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function UserManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const { hasRole, user } = useAuth();

  // Use React Query for data fetching with caching and optimized refetching
  const {
    data: users = [],
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        console.log("Fetching users...");
        
        if (!user) {
          console.log("No authenticated user found");
          return [];
        }
        
        // Get all profiles with more robust error handling
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*");
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found");
          return [];
        }
        
        console.log("Profiles fetched:", profiles.length);
        
        // Get all user roles with better error handling
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select(`
            id,
            user_id,
            role,
            almacen_id,
            created_at,
            almacenes:almacen_id(nombre)
          `);
          
        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
          throw rolesError;
        }
        
        console.log("Roles fetched:", roles?.length || 0);
        
        // Combine the data with improved error handling
        const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
          const userRoles = roles
            ?.filter(r => r.user_id === profile.id)
            .map(role => ({
              ...role,
              almacen_nombre: role.almacenes?.nombre || null
            })) || [];
          
          return {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || null,
            roles: userRoles,
          };
        });
        
        console.log("Combined users with roles:", usersWithRoles.length);
        return usersWithRoles;
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Error al cargar usuarios", {
          description: "No se pudieron cargar los usuarios"
        });
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 seconds before refetching stale data
    retry: 2,
    enabled: !!user && hasRole("admin") // Only run query if user is logged in and has admin role
  });

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Rol eliminado", {
        description: "El rol ha sido eliminado correctamente",
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error("Error al eliminar rol", {
        description: error.message || "No se pudo eliminar el rol",
      });
    }
  };

  const showRoleDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Only admin can access this page
  if (!hasRole("admin")) {
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

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">
              Administre usuarios y asigne roles
            </p>
          </div>
          <Button onClick={() => refetch()}>Reintentar</Button>
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

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administre usuarios y asigne roles
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>
            Lista de usuarios y sus roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserList 
            users={users}
            isLoading={isLoading}
            onDeleteRole={handleDeleteRole}
            onAddRole={showRoleDialog}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedUser && (
          <UserRoleForm 
            selectedUser={selectedUser}
            onSuccess={() => {
              setIsDialogOpen(false);
              refetch();
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
}
