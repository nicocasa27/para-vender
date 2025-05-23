
import React, { useState } from 'react';
import { useTenant } from '@/contexts/tenant/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TenantErrorDisplay } from '@/components/tenant/TenantErrorDisplay';

export default function Welcome() {
  const { 
    tenants, 
    loading, 
    error, 
    switchTenant, 
    createTenant, 
    refreshTenants 
  } = useTenant();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [creating, setCreating] = useState(false);

  // Show error display if there's an error
  if (error && !loading) {
    return (
      <TenantErrorDisplay 
        error={error}
        onRetry={refreshTenants}
        loading={loading}
      />
    );
  }

  // Show loading while tenants are being loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  const handleSelectTenant = async (tenantId: string) => {
    await switchTenant(tenantId);
    navigate('/dashboard');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim() || !newTenantSlug.trim()) return;

    setCreating(true);
    try {
      const newTenant = await createTenant(newTenantName.trim(), newTenantSlug.trim());
      if (newTenant) {
        navigate('/dashboard');
      }
    } finally {
      setCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewTenantName(name);
    setNewTenantSlug(generateSlug(name));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
          <p className="text-muted-foreground mt-2">
            Selecciona una organización para continuar o crea una nueva
          </p>
        </div>

        {tenants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Organizaciones</CardTitle>
              <CardDescription>
                Selecciona la organización con la que quieres trabajar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {tenants.map((tenant) => (
                  <Button
                    key={tenant.id}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => handleSelectTenant(tenant.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tenant.slug}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Nueva Organización
            </CardTitle>
            <CardDescription>
              Configura una nueva organización para tu negocio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCreateForm ? (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Organización
              </Button>
            ) : (
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Organización</Label>
                  <Input
                    id="name"
                    type="text"
                    value={newTenantName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Mi Empresa S.A."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Identificador (slug)</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={newTenantSlug}
                    onChange={(e) => setNewTenantSlug(e.target.value)}
                    placeholder="mi-empresa"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se usará en las URLs. Solo letras, números y guiones.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
