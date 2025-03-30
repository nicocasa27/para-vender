import { Role, UserRole } from "@/types/auth";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  roles: UserRole[];
  isLoading: boolean;
  onRoleUpdated?: () => void; // Opcional callback para refrescar usuarios
}

const ROLES: Role[] = ["admin", "manager", "sales", "viewer"];

export function UserRolesList({ roles, isLoading, onRoleUpdated }: Props) {
  const handleUpdateRole = async (roleId: string, newRole: Role) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("id", roleId);

    if (error) {
      toast.error("Error al actualizar rol", { description: error.message });
      return;
    }

    toast.success("Rol actualizado correctamente");
    onRoleUpdated?.(); // Si existe, refresca usuarios
  };

  return (
    <div className="flex flex-col gap-2">
      {roles.map((role) => (
        <div key={role.id} className="flex items-center gap-2">
          <Select
            value={role.role}
            onValueChange={(value) => handleUpdateRole(role.id, value as Role)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {role.almacen_nombre && (
            <span className="text-xs text-muted-foreground">
              ({role.almacen_nombre})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
