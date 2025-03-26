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

      console.log("Iniciando carga de usuarios con roles desde Supabase...");
      
      // Fetch all users with their roles using a direct query to user_roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          created_at,
          profiles:user_id(id, email, full_name),
          almacenes:almacen_id(nombre)
        `)
        .order('created_at', { ascending: false });
        
      if (userRolesError) {
        console.error("Error fetching user roles:", userRolesError);
        throw userRolesError;
      }
      
      // Get unique user IDs from the roles
      const userIds = [...new Set(userRolesData.map(role => role.user_id))];
      
      if (userIds.length === 0) {
        console.log("No user roles found");
        
        // Fetch profiles without roles as a fallback
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No se encontraron perfiles de usuario");
          setUsers([]);
          return;
        }
        
        // Transform profile data to match UserWithRoles format
        const usersWithoutRoles = profiles.map(profile => ({
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || null,
          created_at: profile.created_at,
          roles: []
        }));
        
        setUsers(usersWithoutRoles);
        toast.success(`${usersWithoutRoles.length} usuarios cargados (sin roles)`);
        return;
      }
      
      // Group roles by user
      const usersMap = new Map<string, UserWithRoles>();
      
      // Process each role and group by user_id
      userRolesData.forEach(role => {
        const userId = role.user_id;
        const profile = role.profiles || { id: userId, email: "Unknown", full_name: null };
        
        // If this user isn't in our map yet, add them
        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            email: profile.email || "Unknown",
            full_name: profile.full_name || null,
            created_at: role.created_at,
            roles: []
          });
        }
        
        // Add this role to the user's roles array
        const userEntry = usersMap.get(userId);
        if (userEntry) {
          userEntry.roles.push({
            ...role,
            almacen_nombre: role.almacenes?.nombre || null
          });
        }
      });
      
      // Fetch any users without roles to include them too
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Continue with what we have instead of throwing
      } else if (profiles) {
        // Add any profiles that weren't included in the roles query
        profiles.forEach(profile => {
          if (!usersMap.has(profile.id)) {
            usersMap.set(profile.id, {
              id: profile.id,
              email: profile.email || "",
              full_name: profile.full_name || null,
              created_at: profile.created_at,
              roles: []
            });
          }
        });
      }
      
      // Convert map values to array
      const usersWithRoles = Array.from(usersMap.values());
      
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
