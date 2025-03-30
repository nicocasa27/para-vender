
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserRolesTable from "@/components/users/UserRolesTable";
import UserRoleForm from "@/components/users/UserRoleForm";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { getUserRolesByUserId } from "@/hooks/users/api/userDataQueries";
import { UserRoleWithStore } from "@/hooks/users/types/userManagementTypes";

export default function UserRoles() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { deleteRole, addRole, loading: apiLoading } = useUsersAndRoles(isAdmin);
  const [roles, setRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const fetchAllRoles = async () => {
    setLoading(true);
    try {
      // Implementa tu lógica para obtener todos los roles de usuario aquí
      const allRoles = await fetchRolesFromDatabase();
      setRoles(allRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener roles de la base de datos
  const fetchRolesFromDatabase = async () => {
    // Esta es una implementación simple, deberás adaptarla a tu estructura
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        almacen_id,
        created_at,
        profiles:user_id(
          email,
          full_name
        ),
        almacenes:almacen_id(
          nombre
        )
      `);

    if (error) throw error;

    // Transformar los datos al formato esperado
    return (data || []).map(role => ({
      id: role.id,
      user_id: role.user_id,
      role: role.role,
      almacen_id: role.almacen_id,
      created_at: role.created_at,
      email: role.profiles?.email || "",
      full_name: role.profiles?.full_name || null,
      almacen_nombre: role.almacenes?.nombre || null
    }));
  };

  const handleRoleDelete = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      await fetchAllRoles(); // Recargar la lista después de eliminar
      toast.success("Rol eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol");
    }
  };

  const handleRoleAssign = async (values: any) => {
    try {
      const { email, role, storeIds } = values;
      
      // Para roles como manager o sales que requieren tienda, asignar a cada tienda seleccionada
      if (storeIds?.length && (role === "manager" || role === "sales")) {
        // Crear un rol para cada tienda seleccionada
        for (const storeId of storeIds) {
          await addRole(email, role, storeId);
        }
      } else {
        // Para roles que no requieren tienda (admin, viewer)
        await addRole(email, role);
      }
      
      await fetchAllRoles(); // Recargar la lista después de añadir
      toast.success("Rol asignado correctamente");
    } catch (error) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol");
      throw error; // Propagar el error para que el formulario lo maneje
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles de Usuario</h1>
          <p className="text-muted-foreground">Gestiona los roles y permisos de los usuarios</p>
        </div>
        <Button onClick={fetchAllRoles} variant="outline">Actualizar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <UserRolesTable 
            roles={roles} 
            onDelete={handleRoleDelete} 
            isLoading={loading}
          />
        </div>
        <div>
          <UserRoleForm 
            onSubmit={handleRoleAssign}
            isLoading={apiLoading}
          />
        </div>
      </div>
    </div>
  );
}
