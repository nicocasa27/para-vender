import { useStores } from "@/hooks/useStores";
import { RoleSelector } from "./RoleSelector";
import { StoreMultiSelect } from "@/components/users/StoreMultiSelect"; // ✅ Import corregido
import { useRoleAssignmentV2 } from "@/hooks/useRoleAssignmentV2";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Role } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  userId: string;
  fullName: string;
  email: string;
  currentRoles: Role[];
  onSuccess: () => void;
}

export function UserRoleForm({
  userId,
  fullName,
  email,
  currentRoles,
  onSuccess,
}: Props) {
  const [role, setRole] = useState<Role | "">("");
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const { assignRole, loading } = useRoleAssignmentV2();

  useEffect(() => {
    if (role !== "sales") {
      setStoreIds([]); // Resetear sucursales si el rol no es sales
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!role) {
      toast.error("Selecciona un rol");
      return;
    }

    const success = await assignRole({ userId, role, almacenIds: storeIds });

    if (success) {
      toast.success("Rol asignado correctamente");
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{fullName}</h3>
        <p className="text-sm text-muted-foreground">{email}</p>
        <Separator className="my-2" />
      </div>

      <RoleSelector value={role} onChange={setRole} />

      {role === "sales" && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Asignar sucursales</p>
          <StoreMultiSelect selected={storeIds} onChange={setStoreIds} />
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading}>
          Asignar Rol
        </Button>
      </div>
    </div>
  );
}
