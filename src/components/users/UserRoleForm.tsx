
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
import { StoreSelector } from "./StoreSelector";
import { useRoleAssignment } from "@/hooks/useRoleAssignment";

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
    handleAddRole 
  } = useRoleAssignment(selectedUser, stores, onSuccess);

  const userName = selectedUser?.full_name || selectedUser?.email || "";

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Asignar Rol</DialogTitle>
        <DialogDescription>
          Asigne un rol al usuario {userName}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddRole)} className="space-y-4">
          <RoleSelector control={form.control} />

          {needsStore && (
            <StoreSelector control={form.control} stores={stores} />
          )}

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Asignando..." : "Asignar Rol"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
