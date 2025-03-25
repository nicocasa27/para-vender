
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from '@/types/auth';
import { toast } from "sonner";

export function useUsersAndRoles(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isAdmin) {
        console.log("Usuario no es administrador, no se cargarán los usuarios");
        setUsers([]);
        return;
      }

      console.log("Iniciando carga de usuarios desde Supabase...");
      
      // Obtener perfiles con información completa
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error("Error al cargar perfiles:", profilesError);
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log("No se encontraron perfiles de usuario");
        setUsers([]);
        return;
      }
      
      console.log(`Perfiles cargados: ${profiles.length}`);
      
      // Obtener roles de usuario con información de almacén
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
        console.error("Error al cargar roles:", rolesError);
        throw rolesError;
      }
      
      console.log(`Roles cargados: ${roles?.length || 0}`);
      
      // Crear objeto combinado con usuarios y sus roles
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
          created_at: profile.created_at,
          roles: userRoles,
        };
      });
      
      console.log(`Datos combinados: ${usersWithRoles.length} usuarios con sus roles`);
      setUsers(usersWithRoles);
      toast.success(`${usersWithRoles.length} usuarios cargados correctamente`);
    } catch (error: any) {
      console.error("Error en useUsersAndRoles:", error);
      setError(error.message || "Error al cargar usuarios");
      toast.error("Error al cargar usuarios", {
        description: error.message || "No se pudieron cargar los datos de usuarios"
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un rol de usuario
  const deleteRole = async (roleId: string) => {
    try {
      console.log(`Eliminando rol con ID: ${roleId}`);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      toast.success("Rol eliminado correctamente");
      
      // Actualizar la lista de usuarios
      fetchUsers();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error("Error al eliminar rol", {
        description: error.message
      });
    }
  };

  // Añadir un rol a un usuario
  const addRole = async (userId: string, roleName: "admin" | "manager" | "sales" | "viewer", almacenId?: string) => {
    try {
      console.log(`Añadiendo rol ${roleName} al usuario ${userId}${almacenId ? ` para almacén ${almacenId}` : ''}`);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: roleName,
          almacen_id: almacenId || null
        });
        
      if (error) throw error;
      
      toast.success("Rol asignado correctamente");
      
      // Actualizar la lista de usuarios
      fetchUsers();
    } catch (error: any) {
      console.error("Error al añadir rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message
      });
    }
  };

  // Eliminar un usuario completamente
  const deleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      console.log(`Eliminando usuario con ID: ${userId}`);
      
      // Primero eliminamos los roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (rolesError) {
        console.error("Error al eliminar roles del usuario:", rolesError);
      }
      
      // Luego eliminamos el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) throw profileError;
      
      toast.success("Usuario eliminado correctamente");
      
      // Actualizar la lista de usuarios
      fetchUsers();
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario", {
        description: error.message
      });
    }
  };

  // Cargar usuarios al montar el componente o cuando cambie isAdmin
  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    deleteRole,
    addRole,
    deleteUser
  };
}
