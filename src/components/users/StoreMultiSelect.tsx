import { useStores } from "@/hooks/useStores";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StoreMultiSelectProps {
  selected: string[];
  onChange: (selectedIds: string[]) => void;
}

export function StoreMultiSelect({ selected, onChange }: StoreMultiSelectProps) {
  const { stores, loading } = useStores();

  const handleToggle = (storeId: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, storeId]);
    } else {
      onChange(selected.filter(id => id !== storeId));
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando sucursales...</div>;
  }

  if (stores.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No hay sucursales disponibles
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] border rounded-md p-2">
      <div className="space-y-2">
        {stores.map((store) => (
          <div key={store.id} className="flex items-center space-x-2">
            <Checkbox
              id={`store-${store.id}`}
              checked={selected.includes(store.id)}
              onCheckedChange={(checked) => 
                handleToggle(store.id, checked === true)
              }
            />
            <label
              htmlFor={`store-${store.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {store.nombre}
            </label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
