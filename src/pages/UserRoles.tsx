
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Save, User, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Tipo de rol
type Role = 'admin' | 'manager' | 'sales' | 'viewer';

// Interfaz para usuario
interface UserWithEmail {
  id: string;
  email: string;
  full_name: string | null;
}

// Interfaz para usuario con roles
interface UserWithRoles extends UserWithEmail {
  roles: {
    id: string;
    role: Role;
    almacen_id: string | null;
    almacen_nombre: string | null;
  }[];
}

export default function UserRoles() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>('viewer');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null);

  // Cargar todos los usuarios con sus roles
  const loadUsers = async () => {
    if (!isAdmin) {
      toast.error("No tienes permisos para gestionar usuarios");
      return;
    }
    
    setLoading(true);
    try {
      // Primero obtenemos los usuarios con sus roles de manera eficiente
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          profiles:user_id(id, email, full_name),
          almacenes:almacen_id(nombre)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Agrupar roles por usuario
      const usersMap = new Map<string, UserWithRoles>();
      
      data?.forEach(item => {
        const userId = item.user_id;
        const profile = item.profiles || { id: userId, email: "Unknown", full_name: null };
        
        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            email: profile.email || "Unknown",
            full_name: profile.full_name,
            roles: []
          });
        }
        
        const userEntry = usersMap.get(userId);
        if (userEntry) {
          userEntry.roles.push({
            id: item.id,
            role: item.role,
            almacen_id: item.almacen_id,
            almacen_nombre: item.almacenes?.nombre || null
          });
        }
      });
      
      // Convertir el mapa a array
      setUsers(Array.from(usersMap.values()));
      toast.success("Lista de usuarios actualizada");
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Buscar un usuario por email
  const searchUserByEmail = async () => {
    if (!email || email.trim() === "") {
      toast.error("Ingresa un email válido");
      return;
    }
    
    setSearchLoading(true);
    try {
      // Buscar primero en profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        setSelectedUser({
          id: profileData.id,
          email: profileData.email || email,
          full_name: profileData.full_name
        });
        toast.success("Usuario encontrado");
        return;
      }
      
      // Si no se encuentra en profiles, buscar en auth.users via la función Edge
      const { data, error } = await supabase.functions.invoke('get_user_id_by_email', {
        body: { email },
      });
      
      if (error) throw error;
      
      if (data) {
        setSelectedUser({
          id: data,
          email: email,
          full_name: null
        });
        toast.success("Usuario encontrado en auth.users");
      } else {
        toast.error("No se encontró ningún usuario con ese email");
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error("Error al buscar usuario:", error);
      toast.error("Error al buscar usuario", { description: error.message });
      setSelectedUser(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Asignar rol a un usuario
  const assignRole = async () => {
    if (!selectedUser) {
      toast.error("Selecciona un usuario primero");
      return;
    }
    
    try {
      // Validar que tenemos un ID de usuario válido
      const userId = selectedUser.id;
      if (!userId || userId === "null" || userId === "undefined") {
        toast.error("ID de usuario inválido");
        return;
      }
      
      // Verificar si el perfil existe, si no, crearlo
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        // Error que no sea "no se encontró ningún registro"
        throw profileCheckError;
      }
      
      // Si no existe el perfil, crearlo
      if (!existingProfile) {
        console.log(`No se encontró perfil para el usuario ${userId}, creando uno...`);
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: selectedUser.full_name || 'Usuario',
            email: selectedUser.email
          });
          
        if (createProfileError) throw createProfileError;
      }
      
      // Verificar si ya existe el mismo rol para el usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', selectedRole)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingRoles) {
        toast.info("El usuario ya tiene este rol asignado");
        return;
      }
      
      // Insertar el rol
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: selectedRole
        });
        
      if (error) throw error;
      
      toast.success("Rol asignado correctamente");
      
      // Recargar la lista de usuarios
      loadUsers();
    } catch (error: any) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol", { description: error.message });
    }
  };

  // Eliminar un rol de usuario
  const deleteRole = async (roleId: string) => {
    try {
      if (!roleId) {
        toast.error("ID de rol inválido");
        return;
      }
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      loadUsers();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", { description: error.message });
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <User className="h-4 w-4" />
          <AlertTitle>Acceso restringido</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles</h1>
          <p className="text-muted-foreground">Asigna y gestiona roles de usuarios</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Asignar nuevo rol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Email del usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={searchUserByEmail} 
              disabled={searchLoading || !email}
            >
              {searchLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          
          {selectedUser && (
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{selectedUser.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedUser.full_name || "Sin nombre"}
                  </div>
                  <div className="text-xs text-muted-foreground">ID: {selectedUser.id}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as Role)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="sales">Vendedor</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={assignRole}>
                  <Save className="h-4 w-4 mr-2" />
                  Asignar Rol
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usuarios y sus roles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.full_name || "Sin nombre"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <div 
                            key={role.id} 
                            className="px-2 py-1 text-xs rounded-md bg-primary/10"
                          >
                            {role.role}
                            {role.almacen_nombre && ` (${role.almacen_nombre})`}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.map(role => (
                          <Button 
                            key={role.id} 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteRole(role.id)}
                            title="Eliminar rol"
                          >
                            ×
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No hay usuarios con roles asignados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
