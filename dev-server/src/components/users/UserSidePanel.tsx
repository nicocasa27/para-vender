
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserWithRoles } from "@/types/auth";
import { useRoleAssignment } from "@/hooks/useRoleAssignment";

interface UserSidePanelProps {
  selectedUser?: UserWithRoles | null;
  onSuccess?: () => Promise<void>;
  onCancel?: () => void;
}

export function UserSidePanel({ 
  selectedUser, 
  onSuccess, 
  onCancel 
}: UserSidePanelProps) {
  const [open, setOpen] = useState(false);

  const { selectedRole, setSelectedRole, assignRole } = useRoleAssignment(
    async () => {
      if (onSuccess) await onSuccess();
      setOpen(false);
    }
  );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onCancel) {
      onCancel();
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    await assignRole(selectedUser.id);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!selectedUser ? (
        <DialogTrigger asChild>
          <Button variant="outline">Abrir Panel de Usuario</Button>
        </DialogTrigger>
      ) : null}
      
      <DialogPortal>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser 
                ? `Gestionar ${selectedUser.full_name || 'Usuario'}`
                : 'Panel de Usuario'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Asignar roles y permisos a ${selectedUser.email}`
                : 'Gestione la información del usuario desde aquí.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedUser ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Asignar Rol</h3>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="viewer">Visitante</option>
                    <option value="sales">Ventas</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
            ) : (
              "Seleccione un usuario para gestionar sus roles"
            )}
          </div>
          
          <DialogFooter>
            {selectedUser ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleAssignRole}>
                  Asignar Rol
                </Button>
              </>
            ) : (
              <DialogClose asChild>
                <Button type="button">Cerrar</Button>
              </DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

// Also export as default
export default UserSidePanel;
