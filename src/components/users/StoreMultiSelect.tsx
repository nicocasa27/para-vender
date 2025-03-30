import { useEffect } from "react";
import { useStores } from "@/hooks/useStores";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function StoreMultiSelect({ selected, onChange }: Props) {
  const { stores, isLoading } = useStores();

  const toggleStore = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando sucursales...</p>;

  if (!stores.length) return <p className="text-sm text-muted-foreground">No hay sucursales disponibles</p>;

  return (
    <div className="space-y-2">
      {stores.map((store) => (
        <div key={store.id} className="flex items-center gap-2">
          <Checkbox
            id={`store-${store.id}`}
            checked={selected.includes(store.id)}
            onCheckedChange={() => toggleStore(store.id)}
          />
          <Label htmlFor={`store-${store.id}`}>{store.nombre}</Label>
        </div>
      ))}
    </div>
  );
}
