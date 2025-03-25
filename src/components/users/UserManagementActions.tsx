
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, UserPlus } from "lucide-react";
import { UserCreateForm } from "./UserCreateForm";

interface UserManagementActionsProps {
  onRefresh: () => Promise<void>;
  onCreateUser: (userData: { email: string; password: string; fullName: string }) => Promise<void>;
  isLoading: boolean;
}

export function UserManagementActions({ onRefresh, onCreateUser, isLoading }: UserManagementActionsProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async (userData: { email: string; password: string; fullName: string }) => {
    try {
      setIsCreating(true);
      await onCreateUser(userData);
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh} 
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        <span>{isLoading ? "Cargando..." : "Actualizar"}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </DialogTrigger>
        <UserCreateForm 
          onCreateUser={handleCreateUser}
          onCancel={() => setOpen(false)}
          isCreating={isCreating}
        />
      </Dialog>
    </div>
  );
}
