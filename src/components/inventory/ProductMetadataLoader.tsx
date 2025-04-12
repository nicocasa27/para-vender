
import React from 'react';
import { Loader, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductMetadataLoaderProps {
  metadataLoading: boolean;
  hasPermissionError: boolean;
  hasMetadata: boolean;
  categories: any[];
  units: any[];
  onClose: () => void;
  onRetryLoad: () => Promise<any>;
  children: React.ReactNode;
}

export function ProductMetadataLoader({
  metadataLoading,
  hasPermissionError,
  hasMetadata,
  categories,
  units,
  onClose,
  onRetryLoad,
  children
}: ProductMetadataLoaderProps) {
  
  const handleRetryLoadMetadata = () => {
    onRetryLoad()
      .then(() => {
        toast.success("Datos actualizados correctamente");
      })
      .catch((error) => {
        console.error("Error al recargar metadatos:", error);
        toast.error("Error al recargar datos");
      });
  };
  
  if (metadataLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }
  
  if (hasPermissionError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center text-destructive font-medium">
          Error de permisos
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          No tienes permisos para acceder a categorías o unidades. Contacta
          al administrador del sistema para obtener acceso.
        </p>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }
  
  if (!hasMetadata || categories.length === 0 || units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          No se pudieron cargar los datos necesarios
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          Faltan categorías o unidades en el sistema. Contacta al
          administrador para verificar si tienes los permisos necesarios.
        </p>
        <Button variant="default" onClick={handleRetryLoadMetadata}>
          Reintentar carga de datos
        </Button>
      </div>
    );
  }
  
  return <>{children}</>;
}
