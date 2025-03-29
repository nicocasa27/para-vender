
import React from "react";
import { UserWithRoles } from "@/types/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewUserList } from "@/components/users/NewUserList";
import { RefreshCw, UserPlus, X } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { UserRoleForm } from "@/components/users/UserRoleForm";
import { UserCreateForm } from "@/components/users/UserCreateForm";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Función helper para validar UUID
const isValidUUID = (uuid: string | null | undefined) => {
  if (!uuid || uuid === "null" || uuid === "undefined") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface UserSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserWithRoles[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteRole: (roleId: string) => Promise<void>;
  onAddRole: (user: UserWithRoles) => void;
  selectedUser: UserWithRoles | null;
  setSelectedUser: (user: UserWithRoles | null) => void;
}

export function UserSidePanel({
  open,
  onOpenChange,
  users,
  loading,
  onRefresh,
  onDeleteRole,
  onAddRole,
  selectedUser,
  setSelectedUser
}: UserSidePanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleRoleAssigned = async () => {
    setDialogOpen(false);
    setSelectedUser(null);
    await onRefresh();
  };

  const handleRefresh = async () => {
    toast.info("Actualizando lista de usuarios...");
    await onRefresh();
  };

  // Validar que el usuario seleccionado tenga un ID válido antes de mostrar el modal
  const isSelectedUserValid = useCallback(() => {
    return selectedUser && isValidUUID(selectedUser.id);
  }, [selectedUser]);

  // Log para depuración cuando cambia el usuario seleccionado
  React.useEffect(() => {
    if (selectedUser) {
      console.log("UserSidePanel - Usuario seleccionado:", {
        id: selectedUser.id,
        tipo: typeof selectedUser.id,
        esValido: isValidUUID(selectedUser.id),
      });
    }
  }, [selectedUser]);

  const handleCreateUser = async (userData: { email: string; password: string; fullName: string }) => {
    try {
      setIsCreatingUser(true);
      
      // Registrar el usuario con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
          },
        },
      });

      if (error) throw error;

      toast.success("Usuario creado correctamente", {
        description: "El usuario ha sido registrado exitosamente"
      });

      // Cerrar el diálogo y refrescar la lista
      setCreateUserDialogOpen(false);
      await onRefresh();
      
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      toast.error("Error al crear usuario", {
        description: error.message || "No se pudo crear el usuario"
      });
    } finally {
      setIsCreatingUser(false);
    }
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
          <Button variant="outline" onClick={handleRefresh} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <UserCreateForm 
                onCreateUser={handleCreateUser} 
                onCancel={() => setCreateUserDialogOpen(false)}
                isCreating={isCreatingUser}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <ScrollArea className="flex-1 h-[calc(100vh-11rem)]">
          <NewUserList 
            users={users} 
            isLoading={loading} 
            onDeleteRole={onDeleteRole} 
            onAddRole={(user) => {
              // Verificar explícitamente que el ID sea un UUID válido
              if (!isValidUUID(user.id)) {
                toast.error("No se puede asignar rol: ID de usuario inválido");
                console.error("ID de usuario inválido:", user.id);
                return;
              }
              
              // Crear una copia limpia del usuario con solo los campos necesarios
              const cleanUser: UserWithRoles = {
                id: user.id,
                email: user.email || user.profiles?.email || "",
                full_name: user.full_name || user.profiles?.full_name || "",
                roles: user.roles || [],
                profiles: user.profiles
              };
              
              console.log("UserSidePanel - Usuario limpio para asignación:", cleanUser);
              setSelectedUser(cleanUser);
              setDialogOpen(true);
            }}
            onSuccess={handleRefresh}
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

      <Dialog open={dialogOpen && isSelectedUserValid()} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setSelectedUser(null);
      }}>
        {selectedUser && isSelectedUserValid() && (
          <DialogContent>
            <UserRoleForm 
              selectedUser={selectedUser} 
              onSuccess={handleRoleAssigned} 
              onCancel={() => {
                setDialogOpen(false);
                setSelectedUser(null);
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </Sheet>
  );
}
