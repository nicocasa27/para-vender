
import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RoleSelector = ({ value, onChange, disabled = false }: Props) => {
  const roles = [
    { value: "admin", label: "Administrador" },
    { value: "manager", label: "Gerente" },
    { value: "sales", label: "Ventas" },
    { value: "viewer", label: "Visitante" }
  ];

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Seleccionar rol" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {roles.map(role => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default RoleSelector;
