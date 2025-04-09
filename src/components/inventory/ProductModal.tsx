import { useState, useEffect } from "react";
import { ProductForm } from "./ProductForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader, AlertTriangle } from "lucide-react";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    categories,
    units,
    isLoading: metadataLoading,
    hasMetadata,
    refetch: refetchMetadata,
    error: metadataError,
    hasPermissionError,
  } = useProductMetadata();

  useEffect(() => {
    if (isOpen) {
      console.log("ProductModal abierto - isEditing:", isEditing);
      console.log("ProductModal - initialData:", initialData);
    }
  }, [isOpen, isEditing, initialData]);

  useEffect(() => {
    if (
      isOpen &&
      (!hasMetadata || categories.length === 0 || units.length === 0)
    ) {
      console.log("ProductModal - Cargando metadatos...");
      refetchMetadata().catch((error) => {
        console.error("Error al cargar metadatos:", error);
        toast.error("Error al cargar datos de categorías y unidades", {
          description: "Por favor, intente nuevamente",
        });
      });
    }
  }, [isOpen, hasMetadata, categories.length, units.length, refetchMetadata]);

  useEffect(() => {
    if (metadataError) {
      console.error("Error de metadatos:", metadataError);
      toast.error("Error al cargar datos necesarios", {
        description: "No se pudieron cargar categorías o unidades",
      });
    }
  }, [metadataError]);

  const handleSubmit = async (data: any) => {
    console.log("✅ ProductModal handleSubmit ejecutado con:", data);

    if (!categories.length || !units.length) {
      toast.error("Datos incompletos", {
        description:
          "No se pueden cargar categorías o unidades. Por favor, intente nuevamente.",
      });
      return;
    }

    if (!data.name || !data.category || !data.unit) {
      toast.error("Datos incompletos", {
        description: "Por favor complete todos los campos obligatorios",
      });
      return;
    }

    const transformedData = {
      nombre: data.name,
      categoria_id: data.category,
      unidad_id: data.unit,
      precio_compra: data.purchasePrice,
      precio_venta: data.salePrice,
      stock_minimo: data.minStock,
      stock_maximo: data.maxStock,
      ...(isEditing && initialData?.id ? { id: initialData.id } : {}),
    };

    console.log("📩 Enviando datos transformados a onSubmit:", transformedData);

    setIsSubmitting(true);
    try {
      await onSubmit(transformedData);
      toast.success(
        isEditing
          ? "Producto actualizado correctamente"
          : "Producto agregado correctamente"
      );
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error(
        isEditing ? "Error al actualizar producto" : "Error al agregar producto"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryLoadMetadata = () => {
    refetchMetadata()
      .then(() => {
        toast.success("Datos actualizados correctamente");
      })
      .catch((error) => {
        console.error("Error al recargar metadatos:", error);
        toast.error("Error al recargar datos");
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Producto" : "Agregar Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualice los datos del producto seleccionado."
              : "Complete el formulario para crear un nuevo producto."}
          </DialogDescription>
        </DialogHeader>

        {metadataLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando datos...</span>
          </div>
        ) : hasPermissionError ? (
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
        ) : !hasMetadata ||
          categories.length === 0 ||
          units.length === 0 ? (
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
        ) : (
          <ProductForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
