import { Role, RoleWithStore } from "@/hooks/users/types/userManagementTypes";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStores } from "@/hooks/useStores";
import { useState } from "react";

interface Props {
  roles: RoleWithStore[];
  isLoading: boolean;
  onRoleUpdated?: () => void;
}

const ROLES: Role[] = ["admin", "manager", "sales", "viewer"];

export function UserRolesList({ roles, isLoading, onRoleUpdated }: Props) {
  const { stores } = useStores();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const userId = roles.length > 0 ? roles[0].user_id : '';

  const handleUpdateRole = async (roleId: string, newRole: Role) => {
    if (newRole !== "sales") {
      await supabase.from("user_roles").delete().eq("user_id", userId);

      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: newRole,
        almacen_id: null,
      });

      if (error) {
        toast.error("Error actualizando rol", { description: error.message });
        return;
      }

      toast.success("Rol actualizado correctamente");
      if (onRoleUpdated) onRoleUpdated();
    } else {
      toast.info("Selecciona sucursales para el rol 'sales'");
    }
  };

  const handleAssignSalesToStores = async () => {
    if (selectedStores.length === 0) {
      toast.warning("Debes seleccionar al menos una sucursal");
      return;
    }

    await supabase.from("user_roles").delete().eq("user_id", userId);

    const inserts = selectedStores.map((storeId) => ({
      user_id: userId,
      role: "sales" as Role,
      almacen_id: storeId,
    }));

    const { error } = await supabase.from("user_roles").insert(inserts);

    if (error) {
      toast.error("Error asignando rol 'sales'", { description: error.message });
      return;
    }

    toast.success("Rol 'sales' y sucursales asignadas");
    if (onRoleUpdated) onRoleUpdated();
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
                <SelectItem key={r} value={r || "role-undefined"}>
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

      {/* Mostrar selección de sucursales si se asigna rol sales */}
      {stores.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {stores.map((store) => (
            <label
              key={store.id}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedStores.includes(store.id)}
                onCheckedChange={() =>
                  setSelectedStores((prev) =>
                    prev.includes(store.id)
                      ? prev.filter((id) => id !== store.id)
                      : [...prev, store.id]
                  )
                }
              />
              {store.nombre}
            </label>
          ))}
          <Button
            onClick={handleAssignSalesToStores}
            size="sm"
            className="col-span-2"
            disabled={selectedStores.length === 0}
          >
            Asignar rol y sucursales
          </Button>
        </div>
      )}
    </div>
  );
}
