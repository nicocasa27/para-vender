
import { useState } from "react";
import { UserRole } from "@/hooks/users/types/userManagementTypes";
import { supabase } from "@/integrations/supabase/client";

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch roles from Supabase
      const { data, error } = await supabase
        .from('user_roles')
        .select('*, profiles(*), almacenes(*)');
        
      if (error) throw error;
      
      // Convert to UserRole[] type
      const formattedRoles: UserRole[] = data.map((role: any) => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        almacen_id: role.almacen_id,
        created_at: role.created_at,
        full_name: role.profiles?.full_name || '',
        email: role.profiles?.email || '',
        almacen_nombre: role.almacenes?.nombre || null
      }));
      
      setRoles(formattedRoles);
      return formattedRoles;
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    roles,
    loading,
    fetchRoles,
  };
}

export default useUserRoles;
