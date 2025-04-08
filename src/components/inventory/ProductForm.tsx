import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductMetadata } from "@/hooks/useProductMetadata"; // Asegúrate de tener este hook
import { toast } from "sonner";
import { updateProduct } from "@/services/inventoryService"; // Asegúrate de tener esta función

export function ProductForm({ initialData, onSuccess }) {
  const { categories, units } = useProductMetadata();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: initialData?.nombre || "",
      categoria_id: initialData?.categoria_id || "",
      unidad_id: initialData?.unidad_id || "",
    },
  });

  const onSubmit = async (data) => {
    console.log("📤 Enviando producto:", data);

    try {
      const result = await updateProduct({ ...initialData, ...data });

      if (result?.error) {
        toast.error("Error al actualizar producto", { description: result.error.message });
      } else {
        toast.success("Producto actualizado con éxito");
        if (onSuccess) onSuccess(); // para cerrar modal o refrescar
      }
    } catch (err) {
      toast.error("Fallo inesperado al guardar", { description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del producto</label>
        <Input {...register("nombre", { required: "Este campo es obligatorio" })} />
        {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre.message}</p>}
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium mb-1">Categoría</label>
        <Controller
          name="categoria_id"
          control={control}
          rules={{ required: "Selecciona una categoría" }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoria_id && <p className="text-red-500 text-sm">{errors.categoria_id.message}</p>}
      </div>

      {/* Unidad */}
      <div>
        <label className="block text-sm font-medium mb-1">Unidad</label>
        <Controller
          name="unidad_id"
          control={control}
          rules={{ required: "Selecciona una unidad" }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una unidad" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.unidad_id && <p className="text-red-500 text-sm">{errors.unidad_id.message}</p>}
      </div>

      {/* Botón */}
      <div className="flex justify-end">
        <Button type="submit">Actualizar item</Button>
      </div>
    </form>
  );
}
