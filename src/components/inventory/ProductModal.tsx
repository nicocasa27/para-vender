
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
import { ProductMetadataLoader } from "./ProductMetadataLoader";
import { transformProductFormData } from "@/utils/inventory/productTransformers";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isEditing?: boolean;
  currentStock?: number;
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  currentStock = 0,
}: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transformedData, setTransformedData] = useState<any>(null);

  const {
    categories,
    units,
    isLoading: metadataLoading,
    hasMetadata,
    refetch: refetchMetadata,
    error: metadataError,
    hasPermissionError,
  } = useProductMetadata();

  // Cargar metadatos cuando sea necesario
  useEffect(() => {
    if (isOpen) {
      console.log("ProductModal abierto - isEditing:", isEditing);
      console.log("ProductModal - initialData:", initialData);
      console.log("ProductModal - currentStock:", currentStock);
    }
  }, [isOpen, isEditing, initialData, currentStock]);

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
    console.log("🧾 handleSubmit recibió:", data);
    console.log("Stock actual:", currentStock);
    
    if (!validateFormData(data, categories, units)) {
      return;
    }

    const productData = transformProductFormData(data, isEditing, initialData?.id, currentStock);
    setTransformedData(productData);
    console.log("📩 ProductModal: Datos transformados:", productData);

    setIsSubmitting(true);
    try {
      toast.info("⏳ Enviando datos a Supabase...");
      await onSubmit(productData);
      toast.success(
        isEditing
          ? "✅ Producto actualizado correctamente"
          : "✅ Producto agregado correctamente"
      );
      onClose();
    } catch (error) {
      console.error("❌ Error en ProductModal.handleSubmit:", error);
      toast.error(
        isEditing ? "❌ Error al actualizar producto" : "❌ Error al agregar producto",
        {
          description: error instanceof Error ? error.message : "Error desconocido"
        }
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateFormData = (data: any, categories: any[], units: any[]) => {
    if (!categories.length || !units.length) {
      const errorMsg = "No se pueden cargar categorías o unidades";
      toast.error("❌ Error:", { description: errorMsg });
      throw new Error(errorMsg);
    }

    if (!data.name || !data.category || !data.unit) {
      const errorMsg = "Por favor complete todos los campos obligatorios";
      toast.error("❌ Error:", { description: errorMsg });
      throw new Error(errorMsg);
    }
    
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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

        <ProductMetadataLoader 
          metadataLoading={metadataLoading}
          hasPermissionError={hasPermissionError}
          hasMetadata={hasMetadata}
          categories={categories}
          units={units}
          onClose={onClose}
          onRetryLoad={refetchMetadata}
        >
          <ProductForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            currentStock={currentStock}
          />
          
          {process.env.NODE_ENV === "development" && transformedData && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold mb-2">Datos transformados que se enviarán a Supabase:</h3>
              <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-green-400 rounded">
                {JSON.stringify(transformedData, null, 2)}
              </pre>
            </div>
          )}
        </ProductMetadataLoader>
      </DialogContent>
    </Dialog>
  );
}
