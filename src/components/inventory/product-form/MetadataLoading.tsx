
import React from "react";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MetadataLoadingProps {
  isLoading: boolean;
  hasMetadata: boolean;
  categories: any[];
  units: any[];
  warehouses: any[];
  isEditing: boolean;
  refetchMetadata: () => Promise<any>;
  refetchWarehouses: () => Promise<any>;
}

export const MetadataLoading: React.FC<MetadataLoadingProps> = ({
  isLoading,
  hasMetadata,
  categories,
  units,
  warehouses,
  isEditing,
  refetchMetadata,
  refetchWarehouses,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos necesarios...</span>
      </div>
    );
  }

  if (!hasMetadata && (categories.length === 0 || units.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          No se pudieron cargar los datos necesarios
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          {categories.length === 0 ? "Faltan categorías. " : ""}
          {units.length === 0 ? "Faltan unidades. " : ""}
          Se intentará crear valores por defecto.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            refetchMetadata().then(() => {
              toast.success("Datos actualizados");
            });
          }}
        >
          Reintentar carga
        </Button>
      </div>
    );
  }

  if (!isEditing && warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center text-destructive font-medium">
          No se pudieron cargar los almacenes
        </div>
        <p className="text-sm text-center text-muted-foreground max-w-md">
          Se necesitan almacenes para agregar inventario inicial.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            refetchWarehouses().then(() => {
              toast.success("Almacenes actualizados");
            });
          }}
        >
          Reintentar carga
        </Button>
      </div>
    );
  }

  return null;
};
