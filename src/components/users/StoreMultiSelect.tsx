
import { useEffect } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreMultiSelectProps {
  field: ControllerRenderProps<any, any>;
  label?: string;
}

export default function StoreMultiSelect({ field, label }: StoreMultiSelectProps) {
  const { stores, isLoading, hasStores, error } = useCurrentStores();

  useEffect(() => {
    if (!field.value && stores.length > 0) {
      field.onChange(stores[0].id); // Selecciona automáticamente la primera opción si no hay valor
    }
  }, [stores, field]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-md" />
      ) : (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una sucursal" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
