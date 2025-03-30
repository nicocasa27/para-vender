import { Drawer } from "@/components/ui/drawer";
import { UserWithRoles } from "@/hooks/users/types/userManagementTypes";
import { UserRoleForm } from "./UserRoleForm";

interface Props {
  selectedUser: UserWithRoles;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export default function UserSidePanel({ selectedUser, onSuccess, onCancel }: Props) {
  return (
    <Drawer open={!!selectedUser} onClose={onCancel}>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">
          Asignar roles a {selectedUser.profiles?.full_name ?? "usuario"}
        </h2>
        <UserRoleForm
          user={selectedUser}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </div>
    </Drawer>
  );
}
