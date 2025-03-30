
import { useState } from "react";
import { UserWithRoles } from "@/types/auth";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { UserRow } from "./UserRow";
import { Dialog } from "@/components/ui/dialog";
import { UserRoleForm } from "./UserRoleForm";
import { Skeleton } from "@/components/ui/skeleton";

interface UserListProps {
  users: UserWithRoles[];
  isLoading: boolean;
  onDeleteRole: (roleId: string) => Promise<void>;
  onAddRole: (user: UserWithRoles) => void;
  onSuccess: () => Promise<void>;
}

export function NewUserList({ users, isLoading, onDeleteRole, onAddRole, onSuccess }: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  
  // Log para depurar
  console.log("NewUserList props:", { 
    users_count: users.length,
    users_sample: users.slice(0, 2).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      profiles_full_name: u.profiles?.full_name,
      roles: u.roles ? u.roles.length : 0
    }))
  });
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <UserRow
                key={user.id}
                user={user}
                onAddRole={(user) => setSelectedUser(user)}
                onDeleteRole={onDeleteRole}
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        {selectedUser && (
          <UserRoleForm
            selectedUser={selectedUser}
            onSuccess={async () => {
              await onSuccess();
              setSelectedUser(null);
            }}
            onCancel={() => setSelectedUser(null)}
          />
        )}
      </Dialog>
    </>
  );
}
