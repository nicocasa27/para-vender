import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, userRoles } = useAuth();
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Perfil actualizado",
        description: "Su información ha sido actualizada correctamente"
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Cargando perfil</h3>
              <p className="text-muted-foreground mt-2">
                Por favor espere mientras cargamos su información.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Perfil</h2>
        <p className="text-muted-foreground">
          Actualice su información personal
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
            <CardDescription>
              Actualice su información de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">
                  {user.user_metadata?.full_name || "Usuario"}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede cambiar
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={isLoading}
            >
              {isLoading ? "Actualizando..." : "Actualizar perfil"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles y permisos</CardTitle>
            <CardDescription>
              Ver sus roles y permisos asignados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center mb-4">
                <ShieldCheck className="h-16 w-16 text-primary opacity-80" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Roles asignados</h3>
                {userRoles && userRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userRoles.map((role) => (
                      <div 
                        key={role.id} 
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(role.role)}`}
                      >
                        {role.role === "admin" && "Administrador"}
                        {role.role === "manager" && "Gerente"}
                        {role.role === "sales" && "Vendedor"}
                        {role.role === "viewer" && "Visualizador"}
                        
                        {role.almacen_nombre && (
                          <span className="ml-1 opacity-80">
                            ({role.almacen_nombre})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tiene roles asignados. Contacte a un administrador.
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Descripción de roles</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex">
                    <span className="rounded-full px-2.5 py-0.5 mr-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">
                      Administrador
                    </span>
                    <span className="text-muted-foreground">Acceso completo al sistema</span>
                  </li>
                  <li className="flex">
                    <span className="rounded-full px-2.5 py-0.5 mr-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                      Gerente
                    </span>
                    <span className="text-muted-foreground">Gestión de inventario y configuración</span>
                  </li>
                  <li className="flex">
                    <span className="rounded-full px-2.5 py-0.5 mr-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      Vendedor
                    </span>
                    <span className="text-muted-foreground">Ventas y acceso limitado por sucursal</span>
                  </li>
                  <li className="flex">
                    <span className="rounded-full px-2.5 py-0.5 mr-2 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 text-xs">
                      Visualizador
                    </span>
                    <span className="text-muted-foreground">Solo acceso de lectura</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
