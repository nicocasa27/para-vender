
import React from "react";
import { UserWithRoles } from "@/types/auth";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserList } from "@/components/users/UserList";
import { RefreshCw, UserPlus, X } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { UserRoleForm } from "@/components/users/UserRoleForm";
import { useState } from "react";

interface UserSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserWithRoles[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteRole: (roleId: string) => void;
  onAddRole: (user: UserWithRoles) => void;
}

export function UserSidePanel({
  open,
  onOpenChange,
  users,
  loading,
  onRefresh,
  onDeleteRole,
  onAddRole
}: UserSidePanelProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddRole = (user: UserWithRoles) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRoleAssigned = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    onRefresh();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-hidden" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-2xl">Gestión de Usuarios</SheetTitle>
          <SheetDescription>
            Administra usuarios y sus roles en el sistema
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            {/* Aquí agregaríamos el formulario de creación de usuarios */}
          </Dialog>
        </div>
        
        <ScrollArea className="flex-1 h-[calc(100vh-11rem)]">
          <UserList 
            users={users} 
            isLoading={loading} 
            onDeleteRole={onDeleteRole}
            onAddRole={handleAddRole}
          />
        </ScrollArea>
        
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedUser && (
          <UserRoleForm 
            selectedUser={selectedUser} 
            onSuccess={handleRoleAssigned} 
            onCancel={handleCloseDialog} 
          />
        )}
      </Dialog>
    </Sheet>
  );
}
