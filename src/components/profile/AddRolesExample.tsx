import { supabase } from "@/integrations/supabase/client";

interface UserRoleInsert {
  user_id: string;
  role: "admin" | "manager" | "sales" | "viewer";
  almacen_id: string;
}

const newRoles: UserRoleInsert[] = [
  { user_id: "abc123", role: "admin", almacen_id: "a1" },
  { user_id: "def456", role: "sales", almacen_id: "a2" },
];

export async function insertUserRoles() {
  const { error } = await supabase
    .from("user_roles")
    .insert(newRoles);

  if (error) {
    console.error("Error insertando roles:", error);
  } else {
    console.log("Roles insertados correctamente ✅");
  }
}
