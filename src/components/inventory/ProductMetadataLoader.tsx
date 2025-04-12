
import React from "react";
import { Loader, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  
  const handleRetryLoad = async () => {
    try {
      toast.info("Intentando cargar metadatos nuevamente...");
      await onRetryLoad();
      toast.success("Datos cargados correctamente");
    } catch (error) {
      console.error("Error al recargar metadatos:", error);
      toast.error("No se pudieron cargar los datos necesarios");
    }
  };
  
  if (metadataLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">
          Cargando categorías y unidades...
        </p>
      </div>
    );
  }
  
  if (hasPermissionError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="p-3 rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-center font-medium">Error de permisos</h3>
        <p className="text-center text-muted-foreground max-w-md">
          No tienes los permisos necesarios para acceder a esta información.
          Por favor, contacta con un administrador.
        </p>
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }
  
  if (!hasMetadata || categories.length === 0 || units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="p-3 rounded-full bg-amber-100">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-center font-medium">Faltan datos básicos</h3>
        <p className="text-center text-muted-foreground max-w-md">
          {categories.length === 0 ? "Faltan categorías. " : ""}
          {units.length === 0 ? "Faltan unidades. " : ""}
          Se necesitan estos datos para continuar.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleRetryLoad}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
