
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@/types/auth";

interface RoleSelectorProps {
  value: Role | ""; // se puede usar "" para estado inicial
  onChange: (role: Role | "") => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange as any}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona un rol" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrador</SelectItem>
        <SelectItem value="manager">Encargado</SelectItem>
        <SelectItem value="sales">Ventas</SelectItem>
        <SelectItem value="viewer">Consulta</SelectItem>
      </SelectContent>
    </Select>
  );
}
