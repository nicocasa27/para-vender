
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
    selectUser,
    selectedUserId,
    userName
  } = useRoleAssignmentV2(onSuccess);

  // Configurar usuario seleccionado cuando cambia el prop y loguear información para depuración
  useEffect(() => {
    console.log("UserRoleForm - Intentando configurar usuario:", {
      id: selectedUser?.id,
      email: selectedUser?.email,
      fullName: selectedUser?.full_name
    });
    
    const selected = selectUser(selectedUser);
    
    console.log("UserRoleForm - Usuario configurado:", {
      éxito: selected,
      userId: selectedUserId,
      userName
    });
  }, [selectedUser, selectUser, selectedUserId, userName]);

  // Verificar si se puede mostrar el formulario
  const canShowForm = !!selectedUserId;

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Asignar Rol</DialogTitle>
        <DialogDescription>
          Asigne un rol al usuario {userName}
        </DialogDescription>
      </DialogHeader>
      
      {!canShowForm && (
        <div className="p-3 mb-3 text-sm bg-destructive/10 text-destructive rounded-md">
          No se puede asignar un rol a este usuario porque no tiene un ID válido. 
          Intente con otro usuario o contacte al administrador del sistema.
        </div>
      )}
      
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
