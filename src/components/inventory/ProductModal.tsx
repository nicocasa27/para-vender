
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

interface ProductData {
  id?: string;
  nombre: string;
  categoria_id: string;
  unidad_id: string;
  descripcion?: string;
  precio_compra?: number;
  precio_venta: number;
  stock_minimo?: number;
  stock_maximo?: number;
  sucursal_id?: string;
  initialStock?: number;
  color?: string;
  talla?: string;
  stockAdjustment?: number;
}

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
    console.log("🧾 handleSubmit recibió:", data);
    
    if (process.env.NODE_ENV === "development") {
      console.log("🧠 ProductModal.handleSubmit: Datos recibidos:", data);
    }
    
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

    const productId = isEditing && initialData?.id ? initialData.id : null;
    console.log("🔑 ProductModal: ID utilizado para la operación:", productId);
    
    const productData: ProductData = {
      id: productId,
      nombre: data.name,
      descripcion: data.description || null,
      categoria_id: data.category,
      unidad_id: data.unit,
      precio_compra: data.purchasePrice,
      precio_venta: data.salePrice,
      stock_minimo: data.minStock,
      stock_maximo: data.maxStock,
      sucursal_id: data.location === "no-location" ? null : data.location,
      color: data.color || null,
      talla: data.talla || null
    };
    
    // Si estamos editando y hay un ajuste de stock, incluirlo
    if (isEditing && typeof data.stockAdjustment === 'number' && data.stockAdjustment !== 0) {
      productData.stockAdjustment = data.stockAdjustment;
    }
    
    if (!isEditing && data.location && data.location !== "no-location" && data.initialStock > 0) {
      productData.initialStock = data.initialStock;
    }
    
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
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
