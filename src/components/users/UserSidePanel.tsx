
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { UserRoleForm } from "./UserRoleForm";

interface Props {
  selectedUser: UserWithRoles | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export default function UserSidePanel({ selectedUser, onSuccess, onCancel }: Props) {
  if (!selectedUser) return null;

  return (
    <Drawer open={!!selectedUser} onClose={onCancel}>
      <DrawerContent className="p-4 max-h-[80vh]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Asignar roles a {selectedUser.full_name ?? "usuario"}
          </h2>

          <UserRoleForm
            userId={selectedUser.id}
            fullName={selectedUser.full_name || ""}
            email={selectedUser.email || ""}
            currentRoles={selectedUser.roles.map(r => r.role)}
            onSuccess={onSuccess}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
