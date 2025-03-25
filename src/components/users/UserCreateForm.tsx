
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface UserCreateFormProps {
  onCreateUser: (userData: { email: string; password: string; fullName: string }) => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

export function UserCreateForm({ onCreateUser, onCancel, isCreating }: UserCreateFormProps) {
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleSubmit = async () => {
    await onCreateUser(newUser);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogDescription>
          Complete los datos para crear un nuevo usuario en el sistema.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre Completo</Label>
          <Input
            id="fullName"
            placeholder="Juan Pérez"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isCreating}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isCreating}
        >
          {isCreating ? "Creando..." : "Crear Usuario"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
