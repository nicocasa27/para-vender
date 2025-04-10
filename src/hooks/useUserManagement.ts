
import { useState, useEffect, useCallback } from "react";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First try to use the view for better performance
      const { data: viewData, error: viewError } = await supabase
        .from('user_roles_with_name')
        .select('*');
        
      if (!viewError && viewData && viewData.length > 0) {
        // Process view data
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
          
          // Add role to user
          const user = userMap.get(row.user_id);
          user.roles.push({
            id: row.id,
            user_id: row.user_id,
            role: row.role,
            almacen_id: row.almacen_id,
            created_at: row.created_at,
            almacen_nombre: row.almacen_nombre
          });
        });
        
        const processedUsers = Array.from(userMap.values());
        setUsers(processedUsers);
        return;
      }
      
      // Fallback: Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // For each profile, fetch their roles
      const usersWithRoles: UserWithRoles[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*, almacenes(*)')
            .eq('user_id', profile.id);
            
          if (rolesError) throw rolesError;
          
          // If no roles found, create a default viewer role
          if (!roles || roles.length === 0) {
            const { data: newRole, error: newRoleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: profile.id,
                role: 'viewer',
                almacen_id: null
              })
              .select()
              .single();
              
            if (!newRoleError && newRole) {
              console.log(`Created default viewer role for user ${profile.id}`);
              roles.push(newRole);
            }
          }
          
          // Format roles
          const formattedRoles = (roles || []).map(role => ({
            id: role.id,
            user_id: role.user_id,
            role: role.role,
            almacen_id: role.almacen_id,
            created_at: role.created_at,
            almacen_nombre: role.almacenes?.nombre || null
          }));
          
          // Convert to UserWithRoles
          return {
            ...profile,
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            roles: formattedRoles
          } as UserWithRoles;
        })
      );
      
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      toast.error("Error al cargar usuarios", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
        
      if (error) throw error;
      
      // Update users list after deletion
      await fetchUsers();
      
      toast.success("Rol eliminado correctamente");
    } catch (error: any) {
      console.error("Error deleting role:", error.message);
      toast.error("Error al eliminar rol", {
        description: error.message
      });
    }
  };

  const createUser = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName
          });
          
        // Create default role
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'viewer',
            almacen_id: null
          });
          
        await fetchUsers();
        toast.success("Usuario creado correctamente");
      }
    } catch (error: any) {
      console.error("Error creating user:", error.message);
      toast.error("Error al crear usuario", {
        description: error.message
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    deleteRole,
    createUser
  };
};

export default useUserManagement;
