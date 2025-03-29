
import { UserWithRoles } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, Trash } from "lucide-react";
import { toast } from "sonner";

// Validador de UUID mejorado
const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || uuid === "null" || uuid === "undefined" || uuid.trim() === "") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface UserRowProps {
  user: UserWithRoles;
  onAddRole: (user: UserWithRoles) => void;
  onDeleteRole: (roleId: string) => void;
}

export function UserRow({ user, onAddRole, onDeleteRole }: UserRowProps) {
  // Log para depurar la estructura completa del usuario
  console.log("UserRow props:", { 
    id: user.id,
    email: user.email, 
    full_name: user.full_name,
    profiles_email: user.profiles?.email,
    profiles_full_name: user.profiles?.full_name,
    roles: user.roles.length,
    tipo_id: typeof user.id,
    valido: isValidUUID(user.id)
  });

  // Usar nombre de profiles si está disponible, si no, usar el de top-level o fallback a "Usuario sin perfil"
  const displayName = user.profiles?.full_name || user.full_name || "Usuario sin perfil";
  const displayEmail = user.profiles?.email || user.email || "Sin email";

  // Función para manejar la adición de rol con validación
  const handleAddRole = () => {
    // Verificación explícita del ID
    if (!isValidUUID(user.id)) {
      console.error("UserRow - ID de usuario inválido:", user.id);
      toast.error("No se puede asignar rol: ID de usuario inválido");
      return;
    }
    
    // Crear una copia limpia del usuario para evitar problemas de referencia
    const sanitizedUser: UserWithRoles = {
      id: user.id, // ID validado
      email: user.email || user.profiles?.email || "",
      full_name: user.full_name || user.profiles?.full_name || "",
      roles: user.roles || [],
      profiles: user.profiles
    };
    
    console.log("UserRow - Pasando usuario sanitizado para asignación:", sanitizedUser);
    onAddRole(sanitizedUser);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{displayName}</span>
          <span className="text-sm text-muted-foreground">{displayEmail}</span>
          {user.created_at && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(user.created_at), "PPP", { locale: es })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {user.roles.length === 0 ? (
            <span className="text-sm text-muted-foreground italic">Sin roles</span>
          ) : (
            user.roles.map(role => (
              <Badge 
                key={role.id}
                variant={role.role === 'admin' ? 'destructive' : 'default'}
                className="flex items-center gap-1"
              >
                {role.role}
                {role.almacen_nombre && ` (${role.almacen_nombre})`}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onDeleteRole(role.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRole}
          disabled={!isValidUUID(user.id)}
          title={!isValidUUID(user.id) ? "ID de usuario inválido" : "Asignar rol a este usuario"}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Asignar Rol
        </Button>
      </TableCell>
    </TableRow>
  );
}
