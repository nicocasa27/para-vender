
import { useEffect } from "react";
import { useStores } from "@/hooks/useStores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreMultiSelectProps {
  selected: string[]; 
  onChange: (selected: string[]) => void;
}

export default function StoreMultiSelect({ selected, onChange }: StoreMultiSelectProps) {
  const { stores, isLoading, hasStores, error } = useStores();

  useEffect(() => {
    if (!selected.length && stores.length > 0) {
      onChange([stores[0].id]); // Selecciona automáticamente la primera opción si no hay valor
    }
  }, [stores, selected, onChange]);

  const handleChange = (value: string) => {
    // Para multi-selección podríamos añadir más lógica, pero por ahora solo usamos una tienda
    onChange([value]);
  };

  return (
    <div className="space-y-1">
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-md" />
      ) : (
        <Select onValueChange={handleChange} value={selected[0] || ""}>
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
