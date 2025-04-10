
import { useStores } from "@/hooks/useStores";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building } from "lucide-react";

interface StoreSelectorProps {
  selectedStore: string | null;
  onStoreChange: (storeId: string | null) => void;
  label?: string;
  className?: string;
}

export function StoreSelector({
  selectedStore,
  onStoreChange,
  label = "Filtrar por sucursal",
  className
}: StoreSelectorProps) {
  const { stores, isLoading } = useStores();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando sucursales...</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Select 
        value={selectedStore || "all"} 
        onValueChange={(value) => onStoreChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las sucursales</SelectItem>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id || "store-without-id"}>
              {store.nombre || "Sin nombre"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
