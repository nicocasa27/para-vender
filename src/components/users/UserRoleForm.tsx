
import { useStores } from "@/hooks/useStores";
import { RoleSelector } from "./RoleSelector";
import { StoreMultiSelect } from "@/components/users/StoreMultiSelect";
import { useRoleAssignmentV2 } from "@/hooks/useRoleAssignmentV2";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Role, UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRoleManagement } from "@/hooks/users/useRoleManagement";

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
  const [loading, setLoading] = useState(false);
  const { addRole } = useRoleManagement();
  
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

    setLoading(true);
    
    try {
      console.log("UserRoleForm: Asignando rol", role, "al usuario", selectedUser.id);
      
      if (role === "sales") {
        if (!storeIds || storeIds.length === 0) {
          toast.warning("Debes seleccionar al menos una sucursal para el rol 'sales'");
          setLoading(false);
          return;
        }
        
        // Para rol 'sales', asignar cada almacén seleccionado
        console.log("UserRoleForm: Asignando rol sales a múltiples almacenes:", storeIds);
        
        const promises = storeIds.map(storeId => 
          addRole(selectedUser.id, role, storeId)
        );
        
        await Promise.all(promises);
        
      } else {
        // Para otros roles, asignar sin almacén
        await addRole(selectedUser.id, role, undefined, onSuccess);
      }
      
      console.log("UserRoleForm: Rol asignado correctamente");
      toast.success("Rol asignado correctamente");
      onSuccess();
    } catch (error) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{selectedUser.full_name || selectedUser.email || "Usuario"}</h3>
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

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !role} className="min-w-24">
          {loading ? "Asignando..." : "Asignar Rol"}
        </Button>
      </div>
    </div>
  );
}
