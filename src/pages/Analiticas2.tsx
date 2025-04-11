
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth";

export default function Analiticas2() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  
  // Safe array access examples
  const safeGetName = (array: any[] | null | undefined) => {
    return array && array.length > 0 ? array[0].nombre : "Sin nombre";
  };
  
  const safeGetId = (array: any[] | null | undefined) => {
    return array && array.length > 0 ? array[0].id : "default-id";
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Analíticas Avanzadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Módulo en desarrollo</h2>
            <p className="text-muted-foreground">
              Esta sección está actualmente en desarrollo. Estamos trabajando para 
              proporcionar analíticas avanzadas para su negocio.
            </p>
            {isAdmin && (
              <p className="mt-4 text-sm text-blue-600">
                Como administrador, tendrás acceso a todas las analíticas cuando 
                estén disponibles.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
