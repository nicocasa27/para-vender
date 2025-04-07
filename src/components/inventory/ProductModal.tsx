
import { useState } from "react";
import { ProductForm } from "./ProductForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader } from "lucide-react";
import { useProductMetadata } from "@/hooks/useProductMetadata";

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
  const { isLoading: metadataLoading } = useProductMetadata();

  const handleSubmit = async (data: any) => {
    console.log("ProductModal handleSubmit:", data);
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
      setIsSubmitting(false);
    }
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
