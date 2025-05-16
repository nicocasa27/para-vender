
import { useState, useEffect } from "react";
import { UserWithRoles, UserRoleWithName, castToUserRole } from "./types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";

export function useFetchUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        
        // Try to get data from the view
        const { data: viewData, error: viewError } = await supabase
          .from('user_roles_with_name')
          .select('*');
          
        if (!viewError && viewData && viewData.length > 0) {
          // Process the view data
          const processedUsers = processUserRoleData(viewData.map(item => ({
            ...item,
            // Ensure role is properly cast to UserRole
            role: castToUserRole(item.role)
          } as UserRoleWithName)));
          
          setUsers(processedUsers);
          setLoading(false);
          return;
        }
        
        // Fallback to manual joins
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        const usersWithRoles: UserWithRoles[] = await Promise.all(
          profiles.map(async profile => {
            const { data: roles, error: rolesError } = await supabase
              .from('user_roles')
              .select('*, almacenes(id,nombre)')
              .eq('user_id', profile.id);
              
            if (rolesError) throw rolesError;
            
            return {
              id: profile.id,
              email: profile.email || "",
              full_name: profile.full_name || "",
              roles: roles.map(role => {
                // Safe access to almacenes with error handling
                const safeAlmacenes = role.almacenes && !role.almacenes.error 
                  ? { id: role.almacenes.id || "", nombre: role.almacenes.nombre || "" }
                  : null;
                
                return {
                  id: role.id,
                  user_id: role.user_id,
                  role: castToUserRole(role.role),
                  almacen_id: role.almacen_id,
                  created_at: role.created_at,
                  almacen_nombre: safeAlmacenes ? safeAlmacenes.nombre : null,
                  almacenes: safeAlmacenes
                };
              }) || []
            };
          })
        );
        
        setUsers(usersWithRoles);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  function processUserRoleData(rolesData: UserRoleWithName[]): UserWithRoles[] {
    const userMap = new Map<string, UserWithRoles>();
    
    rolesData.forEach(role => {
      if (!userMap.has(role.user_id)) {
        userMap.set(role.user_id, {
          id: role.user_id,
          email: role.email || "",
          full_name: role.full_name || "",
          roles: []
        });
      }
      
      const user = userMap.get(role.user_id);
      if (user) {
        user.roles.push({
          id: role.id,
          user_id: role.user_id,
          role: castToUserRole(role.role),
          almacen_id: role.almacen_id,
          created_at: role.created_at || new Date().toISOString(),
          almacen_nombre: role.almacen_nombre || null
        });
      }
    });
    
    return Array.from(userMap.values());
  }

  return { 
    users, 
    loading, 
    error, 
    refetch: async () => {
      setLoading(true);
      try {
        // Implement refetch logic here - similar to fetchUsers
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
  };
}
