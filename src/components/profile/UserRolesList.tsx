import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRoles, UserRoleWithStore } from "@/hooks/users/types/userManagementTypes";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  user: UserWithRoles;
  onRoleAdded: () => void;
  onRoleDeleted: () => void;
}

export function UserRolesList({ user, onRoleAdded, onRoleDeleted }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDeleteRole = async (roleId: string) => {
    setLoading(true);
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast({
        title: "Error al eliminar rol",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rol eliminado",
        description: "El rol se eliminó correctamente",
      });
      onRoleDeleted();
    }
    setLoading(false);
  };

  const roles = user.roles; // Array de objetos, no strings

  return (
    <div className="space-y-2">
      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este usuario no tiene roles asignados.</p>
      ) : (
        roles.map((role) => (
          <div key={role.id} className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
            <div className="flex flex-col">
              <span className="font-medium capitalize">{role.role}</span>
              <span className="text-xs text-muted-foreground">{role.almacen_id}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteRole(role.id)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
