
import { useState, useEffect, useCallback } from 'react';
import { UserWithRoles, RoleWithStore } from '@/hooks/users/types/userManagementTypes';
import { useRoleManagement } from './users/useRoleManagement';
import { useUserDeletion } from './users/useUserDeletion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUsersAndRoles(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  
  // Gestión de roles
  const { deleteRole, addRole: assignRole } = useRoleManagement();
  
  // Eliminación de usuarios
  const { deleteUser } = useUserDeletion();

  // Function to fetch users - usando useCallback para evitar recrear la función
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isAdmin) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      console.log("Iniciando carga de usuarios desde la vista user_roles_with_name...");
      
      // Primero intentamos usar la vista optimizada
      const { data: viewData, error: viewError } = await supabase
        .from('user_roles_with_name')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (viewError) {
        console.error("Error fetching from view:", viewError);
        throw viewError;
      }
      
      // Si la vista tiene datos, los procesamos
      if (viewData && viewData.length > 0) {
        console.log(`Encontrados ${viewData.length} registros desde la vista`);
        
        // Agrupar por usuario
        const userMap = new Map();
        
        viewData.forEach(row => {
          if (!userMap.has(row.user_id)) {
            userMap.set(row.user_id, {
              id: row.user_id,
              email: row.email || "",
              full_name: row.full_name || "Usuario sin nombre",
              created_at: row.created_at,
              roles: []
            });
          }
          
          // Añadir el rol al usuario
          const user = userMap.get(row.user_id);
          // Asegurarse de que almacen_nombre sea una propiedad reconocida por TypeScript
          const almacenNombre = (row as any).almacen_nombre || null;
          
          user.roles.push({
            id: row.id,
            user_id: row.user_id,
            role: row.role,
            almacen_id: row.almacen_id,
            created_at: row.created_at,
            almacen_nombre: almacenNombre
          });
        });
        
        // Convertir el Map a array
        const processedUsers = Array.from(userMap.values());
        console.log(`Procesados ${processedUsers.length} usuarios desde la vista`);
        setUsers(processedUsers);
        return;
      }
      
      // Fallback: Cargar usuarios desde las tablas originales
      console.log("La vista no devolvió datos, usando método alternativo");
      
      // 1. Obtenemos todos los perfiles primero
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log(`Encontrados ${allProfiles.length} perfiles de usuario en total`);
      
      // 2. Luego obtenemos todos los roles con información de almacenes
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, almacenes(*)');
        
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        throw rolesError;
      }
      
      console.log(`Encontrados ${allRoles.length} roles en total`);
      
      // 3. Mapeamos los perfiles y les asignamos sus roles correspondientes
      const usersWithRoles: UserWithRoles[] = allProfiles.map(profile => {
        // Filtramos los roles que pertenecen a este usuario
        const userRoles = allRoles.filter(role => role.user_id === profile.id) || [];
        
        // Si el usuario no tiene roles asignados explícitamente, le asignamos el rol predeterminado 'viewer'
        const roles: RoleWithStore[] = userRoles.length > 0 ? userRoles.map(role => ({
          id: role.id,
          user_id: role.user_id,
          role: role.role,
          almacen_id: role.almacen_id,
          created_at: role.created_at || new Date().toISOString(),
          almacen_nombre: role.almacenes?.nombre || null
        })) : [{
          id: `default-viewer-${profile.id}`,
          user_id: profile.id,
          role: 'viewer',
          almacen_id: null,
          created_at: profile.created_at || new Date().toISOString(),
          almacen_nombre: null
        }];
        
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: roles
        };
      });
      
      console.log(`Procesados ${usersWithRoles.length} usuarios con sus roles`);
      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err as Error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]); // Solo depende de isAdmin

  // Wrapper para asegurar que se actualiza la lista después de eliminar rol
  const handleDeleteRole = async (roleId: string) => {
    // Verificar si es un rol predeterminado (generado dinámicamente)
    if (roleId.startsWith('default-viewer-')) {
      toast.info("No es posible eliminar el rol predeterminado de 'viewer'");
      return;
    }
    
    await deleteRole(roleId);
    // Refrescar la lista después de eliminar
    await fetchUsers();
    toast.success("Rol eliminado y lista actualizada");
  };

  // Wrapper para asegurar que se actualiza la lista después de añadir rol
  const handleAddRole = async (userId: string, roleName: "admin" | "manager" | "sales" | "viewer", almacenId?: string) => {
    await assignRole(userId, roleName, almacenId);
    await fetchUsers();
    toast.success("Rol agregado y lista actualizada");
  };

  // Wrapper para asegurar que se actualiza la lista después de eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    console.log("Eliminando usuario con ID:", userId);
    const success = await deleteUser(userId);
    if (success) {
      console.log("Usuario eliminado, actualizando lista...");
      await fetchUsers();
      toast.success("Usuario eliminado completamente");
    } else {
      console.log("Error o cancelación al eliminar usuario, actualizando lista...");
      await fetchUsers(); // Refrescar la lista de todas formas
    }
  };

  // Iniciar carga de datos
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    deleteRole: handleDeleteRole,
    addRole: handleAddRole,
    deleteUser: handleDeleteUser
  };
}
