
import { useStores } from "@/hooks/useStores";
import { RoleSelector } from "./RoleSelector";
import { StoreMultiSelect } from "@/components/users/StoreMultiSelect";
import { useRoleAssignmentV2 } from "@/hooks/useRoleAssignmentV2";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Role, UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  selectedUser: UserWithRoles;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserRoleForm({
  selectedUser,
  onSuccess,
  onCancel,
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

    const success = await assignRole({ 
      userId: selectedUser.id, 
      role, 
      almacenIds: storeIds 
    });

    if (success) {
      toast.success("Rol asignado correctamente");
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{selectedUser.full_name || "Usuario"}</h3>
        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
        <Separator className="my-2" />
      </div>

      <RoleSelector value={role as Role} onChange={setRole} />

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

export default UserRoleForm;
