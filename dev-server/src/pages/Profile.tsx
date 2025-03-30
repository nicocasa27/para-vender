import { useState } from "react";
import { UserWithRoles } from "@/types/auth";
import UserSidePanel from "./UserSidePanel";
import { RoleWithStore } from "@/hooks/users/types/userManagementTypes";

interface NewUserListProps {
  users: UserWithRoles[];
  onRolesUpdated: () => void;
}

export function NewUserList({ users, onRolesUpdated }: NewUserListProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  return (
    <div>
      <ul className="space-y-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="cursor-pointer hover:bg-muted px-3 py-2 rounded-md"
            onClick={() => setSelectedUser(user)}
          >
            <div className="font-medium">{user.full_name || "Usuario sin nombre"}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </li>
        ))}
      </ul>

      {selectedUser && (
        <UserSidePanel
          selectedUser={selectedUser}
          onSuccess={async () => {
            setSelectedUser(null);
            onRolesUpdated();
          }}
          onCancel={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// Also export as default to make both import styles work
export default NewUserList;