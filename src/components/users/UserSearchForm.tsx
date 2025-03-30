
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface UserWithEmail {
  id: string;
  email: string;
  full_name: string | null;
}

interface UserSearchFormProps {
  email: string;
  setEmail: (email: string) => void;
  selectedUser: UserWithEmail | null;
  searchLoading: boolean;
  searchUserByEmail: () => void;
  selectedRole: string;
  setSelectedRole: (role: any) => void;
  assignRole: (userId: string) => void;
}

export function UserSearchForm({
  email,
  setEmail,
  selectedUser,
  searchLoading,
  searchUserByEmail,
  selectedRole,
  setSelectedRole,
  assignRole
}: UserSearchFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar nuevo rol</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Email del usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={searchUserByEmail} 
            disabled={searchLoading || !email}
          >
            {searchLoading ? "Buscando..." : <><Search className="h-4 w-4 mr-2" /> Buscar</>}
          </Button>
        </div>
        
        {selectedUser && (
          <div className="border rounded-md p-4 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{selectedUser.email}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedUser.full_name || "Sin nombre"}
                </div>
                <div className="text-xs text-muted-foreground">ID: {selectedUser.id}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="sales">Vendedor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => assignRole(selectedUser.id)}>
                Asignar Rol
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
