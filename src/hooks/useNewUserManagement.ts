
// This is a placeholder file to demonstrate safe property access
// Replace this implementation with your actual code

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles } from "./users/types/userManagementTypes";
import { extractProperty } from "@/utils/supabaseHelpers";

/**
 * Check if an object is a Supabase error object
 */
function isErrorObject(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.error === true;
}

export function useNewUserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("*, almacenes(*)");
      
      if (error) throw error;
      
      // Process data safely
      const processedRoles = roles.map(role => {
        // Safe access to almacenes
        const almacenNombre = role.almacenes && !isErrorObject(role.almacenes)
          ? extractProperty(role.almacenes, 'nombre', null)
          : null;
        
        return {
          ...role,
          almacen_nombre: almacenNombre
        };
      });
      
      console.log("Processed roles:", processedRoles);
      // Additional processing would happen here
      
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { users, loading, fetchUsers };
}

export default useNewUserManagement;
