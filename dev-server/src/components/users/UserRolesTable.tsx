import { UserWithRoles } from "@/types/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserRolesList } from "@/components/profile/UserRolesList";
import { RefreshCw, Users } from "lucide-react";

interface UserRolesTableProps {
  users: UserWithRoles[];
  loading: boolean;
  onDeleteRole: (roleId: string) => void;
  onRefresh: () => void; // ✅ ya integrado acá
}

export function UserRolesTable({
  users,
  loading,
  onDeleteRole,
  onRefresh, // ✅ usado más abajo
}: UserRolesTableProps) {
  // ...existing code...
}
