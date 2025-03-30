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
import { useRoleAssignmentV2 } from "@/hooks/useRoleAssignmentV2";
import { useEffect } from "react";
import { toast } from "sonner";

interface UserRoleFormProps {
  selectedUser: UserWithRoles | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Validación básica de email
const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || email === "null" || email === "undefined" || email.trim() === "") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export function UserRoleForm({ selectedUser, onSuccess, onCancel }: UserRoleFormProps) {
  const { stores } = useStores();

  const {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole,
    selectUser,
    selectedUserId,
    userEmail,
    userName
  } = useRoleAssignmentV2({ onSuccess });

  // Configurar usuario al montar
  useEffect(() => {
    if (!selectedUser) {
      console.error("UserRoleForm - No hay usuario seleccionado");
      return;
    }

    if (!isValidEmail(selectedUser.email) && !isValidEmail(selectedUser.profiles?.email)) {
      toast.error("No se puede asignar rol: Email inválido");
      return;
    }

    selectUser(selectedUser);
  }, [selectedUser]);

  const canShowForm = !!userEmail && isValidEmail(userEmail);

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Asignar Rol</DialogTitle>
        <DialogDescription>
          Asigne un rol al usuario <strong>{userName}</strong>
        </DialogDescription>
      </DialogHeader>

      {!canShowForm && (
        <div className="p-3 mb-3 text-sm bg-destructive/10 text-destructive rounded-md">
          Este usuario no tiene un correo válido. No se puede asignar rol.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddRole)} className="space-y-4">
          <RoleSelector control={form.control} />

          {needsStore && (
            <StoreSelector control={form.control} stores={stores} />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !canShowForm}
              title={!canShowForm ? "No se puede asignar rol a este usuario" : undefined}
            >
              {isSubmitting ? "Asignando..." : "Asignar Rol"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
