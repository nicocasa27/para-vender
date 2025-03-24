
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Shield } from "lucide-react";
import { UserList } from "@/components/users/UserList";
import { UserRoleForm } from "@/components/users/UserRoleForm";

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const { hasRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching users...");

      // Get all profiles which is more reliable than auth.users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Profiles fetched:", profiles);
      
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          almacenes:almacen_id(nombre),
          created_at
        `);
        
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        throw rolesError;
      }
      
      console.log("Roles fetched:", roles);
      
      // Combine the data
      const usersWithRoles = profiles.map(profile => {
        const userRoles = roles
          .filter(r => r.user_id === profile.id)
          .map(role => ({
            ...role,
            almacen_nombre: role.almacenes?.nombre || null
          }));
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || null,
          roles: userRoles,
        };
      });
      
      console.log("Combined users with roles:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado correctamente",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el rol",
        variant: "destructive",
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

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administre usuarios y asigne roles
          </p>
        </div>
        <Button onClick={() => fetchUsers()}>Actualizar</Button>
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
        <UserRoleForm 
          selectedUser={selectedUser}
          onSuccess={() => {
            setIsDialogOpen(false);
            fetchUsers();
          }}
          onCancel={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
}
