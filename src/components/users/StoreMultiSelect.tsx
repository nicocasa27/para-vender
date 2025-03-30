
import { useStores } from "@/hooks/useStores";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StoreMultiSelectProps {
  selected: string[];
  onChange: (values: string[]) => void;
}

export function StoreMultiSelect({ selected, onChange }: StoreMultiSelectProps) {
  const { stores, isLoading } = useStores();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando sucursales...</div>;
  }

  if (stores.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay sucursales disponibles</div>;
  }

  const handleToggleStore = (storeId: string) => {
    if (selected.includes(storeId)) {
      onChange(selected.filter(id => id !== storeId));
    } else {
      onChange([...selected, storeId]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      {stores.map(store => (
        <div key={store.id} className="flex items-center space-x-2">
          <Checkbox
            id={store.id}
            checked={selected.includes(store.id)}
            onCheckedChange={() => handleToggleStore(store.id)}
          />
          <Label htmlFor={store.id} className="text-sm cursor-pointer">
            {store.nombre}
          </Label>
        </div>
      ))}
    </div>
  );
}

export default StoreMultiSelect;
