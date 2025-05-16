
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/tenant/TenantContext';
import { CreateTenantDialog } from '@/components/tenant/CreateTenantDialog';
import { useAuth } from '@/hooks/auth/useAuth';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tenants } = useTenant();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Bienvenido a la Plataforma SaaS</CardTitle>
            <CardDescription>
              {tenants.length > 0
                ? "Selecciona o crea una organización para comenzar."
                : "Para comenzar, crea tu primera organización."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenants.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Tus Organizaciones</h3>
                <div className="space-y-2">
                  {tenants.map(tenant => (
                    <Button
                      key={tenant.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        localStorage.setItem('currentTenantId', tenant.id);
                        navigate('/dashboard');
                      }}
                    >
                      {tenant.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Aún no tienes ninguna organización.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Crear Mi Primera Organización
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => signOut()}>
              Cerrar Sesión
            </Button>
            {tenants.length > 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                Nueva Organización
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <CreateTenantDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
};

export default Welcome;
