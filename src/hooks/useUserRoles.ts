
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/hooks/users/types/userManagementTypes";

export function useUserRoles(userId?: string) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          created_at,
          profiles (
            full_name,
            email
          ),
          almacenes (
            nombre
          )
        `)
        .eq("user_id", userId);

      if (error) {
        console.error("Error al cargar roles del usuario:", error.message);
      } else {
        setRoles(
          (data ?? []).map((item) => ({
            ...item,
            email: item.profiles?.email || "",
            full_name: item.profiles?.full_name || null,
            almacen_nombre: item.almacenes?.nombre || null
          }))
        );
      }

      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  return { roles, loading };
}
