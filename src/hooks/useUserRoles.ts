import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "admin" | "manager" | "sales" | "viewer";

type UserRoleItem = {
  id: string;
  user_id: string;
  role: Role;
  almacen_id: string | null;
  almacen_nombre: string | null;
};

type UserWithRoles = {
  id: string;
  email: string;
  full_name: string;
  roles: UserRoleItem[];
};

export function useUserRoles(isAdmin: boolean) {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      toast.error("No tienes permisos para gestionar usuarios");
      return;
    }

    setLoading(true);

    try {
      // Primero intentamos con la vista user_roles_with_name
      const { data: viewData, error: viewError } = await supabase
        .from("user_roles_with_name")
        .select("*")
        .order("created_at", { ascending: false });

      const data = viewData?.length ? viewData : null;

      if (viewError && !data) {
        console.warn("Error al cargar vista, usando fallback:", viewError.message);
      }

      let fallbackData = data;

      // Si no hay datos en la vista, usar fallback con joins
      if (!fallbackData) {
        const { data: rawData, error } = await supabase
          .from("user_roles")
          .select(`
            id,
            user_id,
            role,
            almacen_id,
            created_at,
            profiles:user_id (full_name, email),
            almacenes:almacen_id (nombre)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        fallbackData = rawData;
      }

      const usersMap = new Map<string, UserWithRoles>();

      fallbackData?.forEach((item: any) => {
        const userId = item.user_id;
        const full_name = item.full_name || item.profiles?.full_name || "Usuario sin perfil";
        const email = item.email || item.profiles?.email || "Sin email";

        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            id: userId,
            full_name,
            email,
            roles: [],
          });
        }

        usersMap.get(userId)?.roles.push({
          id: item.id,
          user_id: item.user_id,
          role: item.role,
          almacen_id: item.almacen_id,
          almacen_nombre: item.almacen_nombre || item.almacenes?.nombre || null,
        });
      });

      setUsers(Array.from(usersMap.values()));
      toast.success("Lista de usuarios actualizada");
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  return {
    users,
    loading,
    loadUsers,
  };
}
