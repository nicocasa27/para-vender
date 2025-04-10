
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { productFormSchema, ProductFormValues } from "./schema";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";

export function useProductForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEditing = false,
}: {
  initialData?: ProductFormValues;
  onSubmit: (data: ProductFormValues) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}) {
  const [formData, setFormData] = useState<ProductFormValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const {
    categories,
    units,
    isLoading: metadataLoading,
    hasMetadata,
    refetch: refetchMetadata,
  } = useProductMetadata();

  const {
    stores: warehouses,
    isLoading: warehousesLoading,
    refetch: refetchWarehouses,
  } = useStores();

  const isLoading = metadataLoading || warehousesLoading;

  useEffect(() => {
    console.log("ProductForm montado - isEditing:", isEditing);
    console.log("ProductForm - initialData:", initialData);
  }, [isEditing, initialData]);

  useEffect(() => {
    if (!hasMetadata || categories.length === 0 || units.length === 0) {
      console.log("ProductForm - Recargando metadatos...");
      refetchMetadata().catch((error) => {
        console.error("Error al recargar metadatos:", error);
      });
    }

    if (warehouses.length === 0 && !isEditing) {
      console.log("ProductForm - Recargando almacenes...");
      refetchWarehouses().catch((error) => {
        console.error("Error al recargar almacenes:", error);
      });
    }
  }, [
    hasMetadata,
    categories.length,
    units.length,
    warehouses.length,
    isEditing,
    refetchMetadata,
    refetchWarehouses,
  ]);

  useEffect(() => {
    console.log("ProductForm - Estado actual:", {
      categoriesCount: categories.length,
      unitsCount: units.length,
      warehousesCount: warehouses.length,
      hasMetadata,
      isLoading,
    });
  }, [categories.length, units.length, warehouses.length, hasMetadata, isLoading]);

  const defaultValues: Partial<ProductFormValues> = {
    name: "",
    category: "",
    unit: "",
    purchasePrice: 0,
    salePrice: 0,
    minStock: 0,
    maxStock: 0,
    initialStock: 0,
    warehouse: "",
    ...initialData,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      console.log("Resetting form with initial data:", initialData);
      form.reset(initialData);
    }
  }, [form, initialData]);

  const handleFormSubmit = async (data: ProductFormValues) => {
    console.log("%c📤 Formulario enviado con datos:", "color: green; font-weight: bold", data);
    console.log("✅ handleFormSubmit ejecutado con:", data);

    setFormData(data);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (categories.length === 0 || units.length === 0) {
      const errorMsg =
        "No hay categorías o unidades disponibles. Por favor, crea primero estos valores.";
      setSubmitError(errorMsg);
      toast.error("❌ Datos incompletos", {
        description: errorMsg,
      });
      return;
    }

    if (!isEditing && !data.warehouse && warehouses.length > 0) {
      const errorMsg = "Por favor seleccione un almacén";
      setSubmitError(errorMsg);
      toast.error("❌ Almacén requerido", {
        description: "Debes seleccionar un almacén para productos nuevos",
      });
      return;
    }

    if (isEditing && !data.name) {
      toast.error("❌ Nombre requerido para editar");
      return;
    }

    toast("📨 Enviando...", {
      description: isEditing ? "Actualizando producto..." : "Agregando producto...",
    });

    try {
      // Siempre llamamos a onSubmit con los datos
      await onSubmit(data);
      setSubmitSuccess(true);

      // Mostramos notificación de éxito
      toast.success(
        isEditing ? "✅ Producto actualizado correctamente" : "✅ Producto agregado correctamente",
        {
          description: isEditing
            ? "Los cambios han sido guardados"
            : "El producto ha sido agregado al inventario",
        }
      );
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      const errorMsg = error instanceof Error ? error.message : "Ocurrió un error desconocido";
      setSubmitError(errorMsg);
      toast.error("❌ Error al guardar", {
        description: errorMsg,
      });
    }
  };

  const handleReset = () => {
    form.reset(defaultValues);
  };

  return {
    form,
    formData,
    submitError,
    submitSuccess,
    isLoading,
    hasMetadata,
    categories,
    units,
    warehouses,
    refetchMetadata,
    refetchWarehouses,
    handleFormSubmit,
    handleReset,
  };
}
