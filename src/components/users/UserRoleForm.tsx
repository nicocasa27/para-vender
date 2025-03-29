
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

// Validador de email compartido
const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email || email === "null" || email === "undefined" || email.trim() === "") return false;
  // Validación básica de email
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
  } = useRoleAssignmentV2(onSuccess);

  // Configurar usuario seleccionado cuando cambia el prop con logs detallados
  useEffect(() => {
    console.log("UserRoleForm - Intentando configurar usuario:", {
      id: selectedUser?.id,
      email: selectedUser?.email,
      fullName: selectedUser?.full_name,
      isNull: selectedUser === null,
      emailValido: selectedUser ? isValidEmail(selectedUser.email) : false
    });
    
    if (!selectedUser) {
      console.error("UserRoleForm - No hay usuario seleccionado");
      return;
    }
    
    // Validación explícita del email y retroalimentación visual
    if (!isValidEmail(selectedUser.email) && 
        !isValidEmail(selectedUser.profiles?.email)) {
      console.error("UserRoleForm - Email de usuario inválido:", selectedUser.email);
      toast.error("No se puede asignar rol: Email de usuario inválido");
      return;
    }
    
    // Si el email es válido, seleccionar el usuario
    const selected = selectUser(selectedUser);
    
    console.log("UserRoleForm - Resultado de configuración de usuario:", {
      éxito: selected,
      userId: selectedUserId,
      userEmail: userEmail,
      userName: userName
    });
  }, [selectedUser, selectUser, selectedUserId, userEmail, userName]);

  // Verificar si se puede mostrar el formulario
  const canShowForm = !!userEmail && isValidEmail(userEmail);

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
          No se puede asignar un rol a este usuario porque no tiene información válida. 
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
