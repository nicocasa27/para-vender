
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserWithRoles } from '@/hooks/users/types/userManagementTypes';
import UserSidePanel from "@/components/users/UserSidePanel";

export function UserManagement() {
  const { users, loading, loadUsers, handleDeleteUser } = useUserManagement();
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = async () => {
    await loadUsers();
    toast.success("Usuarios actualizados");
  };

  const handleUserSelect = (user: UserWithRoles) => {
    // Convert auth.UserWithRoles to userManagementTypes.UserWithRoles if needed
    const formattedUser: UserWithRoles = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      roles: user.roles.map(role => ({
        id: role.id,
        user_id: role.user_id,
        role: role.role,
        almacen_id: role.almacen_id,
        created_at: role.created_at || '',
        almacen_nombre: role.almacen_nombre
      }))
    };
    
    setSelectedUser(formattedUser);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gestión de Usuarios</h2>
        <Button onClick={handleRefresh} variant="outline">Actualizar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No hay usuarios para mostrar</p>
              </div>
            ) : (
              <div className="divide-y">
                {users.map(user => (
                  <div key={user.id} className="p-4 flex justify-between items-center hover:bg-accent/10">
                    <div>
                      <h3 className="font-medium">{user.full_name || user.email}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.map(role => (
                          <span 
                            key={role.id} 
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                          >
                            {role.role}
                            {role.almacen_nombre && ` (${role.almacen_nombre})`}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleUserSelect(user)}>
                        Gestionar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {selectedUser && (
        <UserSidePanel
          selectedUser={selectedUser}
          onSuccess={async () => {
            await loadUsers();
            setSelectedUser(null);
          }}
          onCancel={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
