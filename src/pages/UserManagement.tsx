
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRole } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Edit, Trash, Store, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "Usuario es requerido"),
  role: z.enum(["admin", "manager", "sales", "viewer"] as const),
  almacenId: z.string().optional(),
});

type RoleAssignmentValues = z.infer<typeof roleAssignmentSchema>;

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [stores, setStores] = useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const { hasRole } = useAuth();
  const { toast } = useToast();

  const form = useForm<RoleAssignmentValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: "",
      role: "viewer",
      almacenId: "",
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchStores();
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

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("almacenes")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales",
        variant: "destructive",
      });
    }
  };

  const handleAddRole = async (values: RoleAssignmentValues) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: values.userId,
          role: values.role,
          almacen_id: values.role === "sales" ? values.almacenId : null,
        });

      if (error) throw error;

      toast({
        title: "Rol asignado",
        description: "El rol ha sido asignado correctamente",
      });

      form.reset();
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el rol",
        variant: "destructive",
      });
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
    form.setValue("userId", user.id);
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

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "sales":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Roles asignados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || "Sin nombre"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {user.roles.map((role) => (
                              <div 
                                key={role.id} 
                                className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(role.role as UserRole)}`}
                              >
                                {role.role} 
                                {role.almacen_nombre && (
                                  <span className="ml-1 opacity-80">
                                    ({role.almacen_nombre})
                                  </span>
                                )}
                                <button 
                                  className="ml-1.5 hover:text-destructive" 
                                  onClick={() => handleDeleteRole(role.id)}
                                >
                                  <Trash className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin roles asignados</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => showRoleDialog(user)}
                        >
                          <UserPlus className="h-4 w-4" />
                          <span className="sr-only">Asignar rol</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No hay usuarios registrados</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Los usuarios aparecerán aquí cuando se registren
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Rol</DialogTitle>
            <DialogDescription>
              Asigne un rol al usuario {selectedUser?.full_name || selectedUser?.email || ""}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddRole)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="sales">Vendedor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("role") === "sales" && (
                <FormField
                  control={form.control}
                  name="almacenId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sucursal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una sucursal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Asignar Rol</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
