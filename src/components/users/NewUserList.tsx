
import { useState } from "react";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserRoleForm } from "@/components/users/UserRoleForm";

interface NewUserListProps {
  users: UserWithRoles[];
  onRolesUpdated: () => void;
}

export function NewUserList({ users, onRolesUpdated }: NewUserListProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);

  const handleUserClick = (user: UserWithRoles) => {
    setSelectedUser(user);
    setShowRoleForm(true);
  };

  const handleSuccess = async () => {
    setShowRoleForm(false);
    setSelectedUser(null);
    await onRolesUpdated();
  };

  const handleCancel = () => {
    setShowRoleForm(false);
    setSelectedUser(null);
  };

  return (
    <div>
      <ul className="space-y-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="cursor-pointer hover:bg-muted px-3 py-2 rounded-md"
            onClick={() => handleUserClick(user)}
          >
            <div className="font-medium">{user.full_name || "Usuario sin nombre"}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </li>
        ))}
      </ul>

      {selectedUser && showRoleForm && (
        <Sheet open={showRoleForm} onOpenChange={setShowRoleForm}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Asignar rol a {selectedUser.full_name}</SheetTitle>
              <SheetDescription>
                Configura los permisos del usuario en el sistema
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <UserRoleForm 
                selectedUser={selectedUser}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </div>
            
            <div className="mt-4">
              <Button variant="outline" onClick={handleCancel} className="w-full">
                Cancelar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// Export as default to make both import styles work
export default NewUserList;
