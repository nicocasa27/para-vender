import { UserWithRoles } from "@/types/auth";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStores } from "@/hooks/useStores";
import { RoleSelector } from "./RoleSelector";
import { StoreMultiSelect } from "./StoreMultiSelect";
import { useRoleAssignmentV2 } from "@/hooks/useRoleAssignmentV2";
import { useEffect } from "react";
import { toast } from "sonner";

interface UserRoleFormProps {
  selectedUser: UserWithRoles | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserRoleForm({ selectedUser, onSuccess, onCancel }: UserRoleFormProps) {
  const { stores } = useStores();
  const {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole,
    selectedStoreIds,
    setSelectedUser,
    setSelectedStoreIds,
  } = useRoleAssignmentV2({ onSuccess });

  useEffect(() => {
    if (selectedUser) {
      setSelectedUser(selectedUser);
      setSelectedStoreIds([]); // Reset store selection
    }
  }, [selectedUser]);

  const userName = selectedUser?.full_name || selectedUser?.email || "Usuario desconocido";

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Asignar Rol</DialogTitle>
        <DialogDescription>Asigna un rol a {userName}</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddRole)} className="space-y-4">
          <RoleSelector control={form.control} />

          {needsStore && (
            <StoreMultiSelect
              stores={stores}
              selected={selectedStoreIds}
              onChange={setSelectedStoreIds}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Asignando..." : "Asignar rol"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
