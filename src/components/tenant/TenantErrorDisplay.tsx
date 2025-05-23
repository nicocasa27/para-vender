
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TenantErrorDisplayProps {
  error: string;
  onRetry: () => void;
  loading: boolean;
}

export function TenantErrorDisplay({ error, onRetry, loading }: TenantErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Error de Organización</CardTitle>
          <CardDescription>
            Hubo un problema al cargar tus organizaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button 
            onClick={onRetry} 
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Reintentando...' : 'Reintentar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
