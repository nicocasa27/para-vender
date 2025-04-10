import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRoleWithStore } from "@/types/auth";
import { toast } from "sonner";

export function useNewUserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*');

      if (userError) {
        throw userError;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          almacenes(nombre)
        `);

      if (rolesError) {
        throw rolesError;
      }

      // Process the data to create UserWithRoles objects
      const processedUsers = userData.map(user => {
        // Get roles for this user
        const userRoles = rolesData
          .filter(role => role.user_id === user.id)
          .map(role => {
            // Handle almacenes data which might be an array or object
            const almacenesData = role.almacenes;
            let almacenNombre = '';
            
            if (almacenesData) {
              if (Array.isArray(almacenesData)) {
                // Handle array case
                if (almacenesData.length > 0) {
                  almacenNombre = almacenesData[0].nombre || '';
                }
              } else {
                // Handle object case
                almacenNombre = almacenesData.nombre || '';
              }
            }
            
            return {
              id: role.id,
              user_id: role.user_id,
              role: role.role,
              almacen_id: role.almacen_id,
              almacen_nombre: almacenNombre,
              created_at: role.created_at
            } as UserRoleWithStore;
          });

        // Return combined user object
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          created_at: user.created_at,
          roles: userRoles
        } as UserWithRoles;
      });

      setUsers(processedUsers);

    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    reloadUsers: loadUsers
  };
}
