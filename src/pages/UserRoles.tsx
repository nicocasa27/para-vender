import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserRolesTable from "@/components/users/UserRolesTable";
import UserRoleForm from "@/components/users/UserRoleForm";
import { useUsersAndRoles } from "@/hooks/useUsersAndRoles";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { getUserRolesByUserId } from "@/hooks/users/api/userDataQueries";
import { UserRole } from "@/hooks/users/types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";

export default function UserRoles() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const { deleteRole, addRole, loading: apiLoading } = useUsersAndRoles(isAdmin);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const fetchAllRoles = async () => {
    setLoading(true);
    try {
      const allRoles = await fetchRolesFromDatabase();
      setRoles(allRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesFromDatabase = async () => {
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
      await fetchAllRoles();
      toast.success("Rol eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol");
    }
  };

  const handleRoleAssign = async (values: any) => {
    try {
      const { email, role, storeIds } = values;
      
      if (storeIds?.length && (role === "manager" || role === "sales")) {
        for (const storeId of storeIds) {
          await addRole(email, role, storeId);
        }
      } else {
        await addRole(email, role);
      }
      
      await fetchAllRoles();
      toast.success("Rol asignado correctamente");
    } catch (error) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol");
      throw error;
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
