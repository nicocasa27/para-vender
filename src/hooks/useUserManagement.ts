
import { useState, useEffect } from "react";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // For each profile, fetch their roles
      const usersWithRoles: UserWithRoles[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*, profiles(*), almacenes(*)')
            .eq('user_id', profile.id);
            
          if (rolesError) throw rolesError;
          
          // Convert roles to the expected format
          return {
            ...profile,
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            roles: roles || []
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

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    deleteRole
  };
};

export default useUserManagement;
