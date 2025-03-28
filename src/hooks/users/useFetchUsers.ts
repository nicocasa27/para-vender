
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from '@/types/auth';
import { toast } from "sonner";

export function useFetchUsers(isAdmin: boolean) {
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
          profiles:user_id(
            id,
            email,
            full_name
          ),
          almacenes:almacen_id(nombre)
        `)
        .order('created_at', { ascending: false });
        
      if (userRolesError) {
        console.error("Error fetching user roles:", userRolesError);
        throw userRolesError;
      }
      
      console.log("Datos de user_roles cargados:", userRolesData);
      
      // Get unique user IDs from the roles
      const userIds = [...new Set(userRolesData.map(role => role.user_id))];
      
      if (userIds.length === 0) {
        console.log("No user roles found");
        
        // Si no hay roles, obtener directamente los perfiles
        const users = await fetchProfilesWithoutRoles();
        console.log("Usuarios sin roles cargados:", users);
        setUsers(users);
        toast.success(`${users.length} usuarios cargados (sin roles)`);
        return;
      }
      
      const usersWithRoles = await processUserRolesData(userRolesData);
      console.log(`Datos combinados: ${usersWithRoles.length} usuarios con sus roles`);
      
      // Log detallado para depurar si hay información de full_name y email
      console.log("Muestra de datos de usuarios:", 
        usersWithRoles.slice(0, 3).map(u => ({ 
          id: u.id, 
          email: u.email,
          full_name: u.full_name,
          roles_count: u.roles.length 
        }))
      );
      
      setUsers(usersWithRoles);
      toast.success(`${usersWithRoles.length} usuarios cargados correctamente`);
    } catch (error: any) {
      console.error("Error en useFetchUsers:", error);
      setError(error.message || "Error al cargar usuarios");
      toast.error("Error al cargar usuarios", {
        description: error.message || "No se pudieron cargar los datos de usuarios"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch profiles without roles as a fallback
  const fetchProfilesWithoutRoles = async (): Promise<UserWithRoles[]> => {
    console.log("Cargando perfiles de usuario sin roles asignados");
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    console.log("Perfiles cargados desde Supabase:", profiles);
    
    if (!profiles || profiles.length === 0) {
      console.log("No se encontraron perfiles de usuario");
      return [];
    }
    
    console.log(`Se encontraron ${profiles.length} perfiles de usuario sin roles`);
    
    // Transform profile data to match UserWithRoles format (normalizado)
    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email || "",
      full_name: profile.full_name || null,
      created_at: profile.created_at,
      roles: []
    }));
  };

  // Process user roles data and combine with profiles
  const processUserRolesData = async (userRolesData: any[]): Promise<UserWithRoles[]> => {
    // Group roles by user
    const usersMap = new Map<string, UserWithRoles>();
    
    console.log("Procesando datos de roles...");
    
    // Process each role and group by user_id
    userRolesData.forEach(role => {
      const userId = role.user_id;
      const profile = role.profiles || { id: userId, email: "Unknown", full_name: null };
      
      console.log("Procesando rol para usuario:", { 
        userId, 
        profile_info: { 
          id: profile.id, 
          email: profile.email,
          full_name: profile.full_name 
        } 
      });
      
      // If this user isn't in our map yet, add them
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          id: userId,
          email: profile.email || "",
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
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // Continue with what we have instead of throwing
    } else if (profiles) {
      console.log("Perfiles adicionales cargados:", profiles.length);
      
      // Add any profiles that weren't included in the roles query
      profiles.forEach(profile => {
        if (!usersMap.has(profile.id)) {
          console.log("Añadiendo perfil sin roles:", { 
            id: profile.id, 
            email: profile.email, 
            full_name: profile.full_name 
          });
          
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
    
    // Convert map values to array and return
    const result = Array.from(usersMap.values());
    console.log("Resultado final de usuarios procesados:", result.slice(0, 2));
    return result;
  };

  // Cargar usuarios al montar el componente o cuando cambie isAdmin
  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  return {
    users,
    loading,
    error,
    fetchUsers
  };
}
