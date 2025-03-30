import { Role, UserRole } from "@/types/auth";
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
  roles: UserRole[];
  isLoading: boolean;
  onRoleUpdated?: () => void;
}

const ROLES: Role[] = ["admin", "manager", "sales", "viewer"];

export function UserRolesList({ roles, isLoading, onRoleUpdated }: Props) {
  const { stores } = useStores();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const userId = roles[0]?.user_id;

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
      onRoleUpdated?.();
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
      role: "sales",
      almacen_id: storeId,
    }));

    const { error } = await supabase.from("user_roles").insert(inserts);

    if (error) {
      toast.error("Error asignando rol 'sales'", { description: error.message });
      return;
    }

    toast.success("Rol 'sales' y sucursales asignadas");
    onRoleUpdated?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={roles[0].role}
        onValueChange={(value) => handleUpdateRole(roles[0].id, value as Role)}
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

      {roles[0].role === "sales" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Sucursales permitidas:
          </label>
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <label key={store.id} className="flex items-center gap-1 text-sm">
                <Checkbox
                  checked={selectedStores.includes(store.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStores((prev) => [...prev, store.id]);
                    } else {
                      setSelectedStores((prev) =>
                        prev.filter((id) => id !== store.id)
                      );
                    }
                  }}
                />
                {store.nombre}
              </label>
            ))}
          </div>
          <Button
            size="sm"
            className="mt-2 w-fit"
            onClick={handleAssignSalesToStores}
            disabled={isLoading || selectedStores.length === 0}
          >
            Asignar sucursales
          </Button>
        </div>
      )}
    </div>
  );
}
