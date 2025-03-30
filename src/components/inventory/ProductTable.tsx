import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "manager" | "sales" | "viewer";
  almacen_id: string;
}

export function UserRolesList() {
  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, almacen_id");

      if (error) {
        console.error("Error cargando roles:", error);
        return;
      }

      setRoles(data as UserRole[]);
    };

    fetchRoles();
  }, []);

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div key={role.id} className="border rounded p-4">
          <p><strong>User ID:</strong> {role.user_id}</p>
          <p><strong>Rol:</strong> {role.role}</p>
          <p><strong>Almacén:</strong> {role.almacen_id}</p>
        </div>
      ))}
    </div>
  );
}
