
import React from 'react';
import { AlertCircle, RefreshCw, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TenantErrorDisplayProps {
  error: string;
  onRetry: () => void;
  loading: boolean;
}

export function TenantErrorDisplay({ error, onRetry, loading }: TenantErrorDisplayProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.clear();
      navigate('/auth');
      toast.success("Sesión cerrada correctamente");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const isConfigurationError = error.includes('configuración') || 
                              error.includes('recursion') || 
                              error.includes('infinite');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {isConfigurationError ? 'Error del Sistema' : 'Error de Organización'}
          </CardTitle>
          <CardDescription className="text-sm">
            {isConfigurationError 
              ? 'Hay un problema con la configuración del sistema'
              : 'Hubo un problema al cargar tus organizaciones'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">Detalles del error:</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
          
          <div className="grid gap-2">
            {!isConfigurationError && (
              <Button 
                onClick={onRetry} 
                disabled={loading}
                className="w-full"
                variant="default"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Reintentando...' : 'Reintentar'}
              </Button>
            )}
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
          
          {isConfigurationError && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Si el problema persiste, contacta al equipo de soporte técnico.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
