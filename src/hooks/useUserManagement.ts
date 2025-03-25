
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "@/types/auth";
import { toast } from "sonner";

export function useUserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRoles[]>([]);

  const loadUsers = async () => {
    try {
      console.log("UserManagement: Cargando usuarios...");
      setLoading(true);
      
      // Obtener perfiles de usuario con ordenación explícita por fecha de creación descendente
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error("UserManagement: Error al cargar perfiles:", profilesError);
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log("UserManagement: No se encontraron perfiles");
        setUsers([]);
        setLoading(false);
        return;
      }
      
      console.log("UserManagement: Perfiles cargados:", profiles.length);
      console.log("UserManagement: Datos de perfiles:", profiles);
      
      // Obtener roles de usuarios
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
        console.error("UserManagement: Error al cargar roles:", rolesError);
        throw rolesError;
      }
      
      console.log("UserManagement: Roles cargados:", roles?.length || 0);
      
      // Combinar datos de usuarios y roles
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
      
      console.log("UserManagement: Usuarios con roles:", usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("UserManagement: Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios", {
        description: error.message || "No se pudieron cargar los usuarios",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      try {
        console.log("UserManagement: Eliminando usuario:", userId);
        
        // Primero eliminamos los roles del usuario
        const { error: rolesError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
          
        if (rolesError) {
          console.error("UserManagement: Error al eliminar roles del usuario:", rolesError);
          throw rolesError;
        }
        
        // Luego eliminamos el perfil del usuario
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);
          
        if (profileError) {
          console.error("UserManagement: Error al eliminar perfil del usuario:", profileError);
          throw profileError;
        }
        
        // Finalmente, eliminamos el usuario de la autenticación
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        
        if (authError) {
          console.error("UserManagement: Error al eliminar usuario de auth:", authError);
          toast.error("Error parcial al eliminar usuario", {
            description: "El perfil y roles del usuario se eliminaron, pero no se pudo eliminar el usuario de autenticación",
          });
        } else {
          toast.success("Usuario eliminado", {
            description: "El usuario ha sido eliminado correctamente",
          });
        }
        
        // Refrescar la lista después de eliminar
        await loadUsers();
      } catch (error: any) {
        console.error("UserManagement: Error al eliminar usuario:", error);
        toast.error("Error al eliminar usuario", {
          description: error.message || "No se pudo eliminar el usuario",
        });
      }
    }
  };

  return {
    users,
    loading,
    loadUsers,
    handleDeleteUser
  };
}
