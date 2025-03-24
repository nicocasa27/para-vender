
import { UserRole } from "@/types/auth";
import { Trash } from "lucide-react";
import { memo } from "react";

interface UserRoleBadgeProps {
  id: string;
  role: UserRole;
  storeName?: string | null;
  onDelete: (roleId: string) => void;
}

// Memoize the component to prevent unnecessary re-renders
export const UserRoleBadge = memo(function UserRoleBadge({ id, role, storeName, onDelete }: UserRoleBadgeProps) {
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "sales":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onDelete(id);
  };

  return (
    <div
      className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(role)}`}
    >
      {role}
      {storeName && (
        <span className="ml-1 opacity-80">({storeName})</span>
      )}
      <button
        className="ml-1.5 hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash className="h-3 w-3" />
      </button>
    </div>
  );
});
