
import { Role } from "@/hooks/users/types/userManagementTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction } from "react";

export interface RoleSelectorProps {
  value: Role | "";
  onChange: Dispatch<SetStateAction<Role | "">>;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Selecciona un rol</p>
      <RadioGroup value={value} onValueChange={(value) => onChange(value as Role)}>
        <div className="flex items-center space-x-2 py-1">
          <RadioGroupItem value="admin" id="admin" />
          <Label htmlFor="admin" className="cursor-pointer">Administrador</Label>
        </div>
        <div className="flex items-center space-x-2 py-1">
          <RadioGroupItem value="manager" id="manager" />
          <Label htmlFor="manager" className="cursor-pointer">Manager</Label>
        </div>
        <div className="flex items-center space-x-2 py-1">
          <RadioGroupItem value="sales" id="sales" />
          <Label htmlFor="sales" className="cursor-pointer">Ventas</Label>
        </div>
        <div className="flex items-center space-x-2 py-1">
          <RadioGroupItem value="viewer" id="viewer" />
          <Label htmlFor="viewer" className="cursor-pointer">Visitante</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export default RoleSelector;
