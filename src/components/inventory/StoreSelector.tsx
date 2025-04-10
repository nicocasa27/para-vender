
import { useStores } from "@/hooks/useStores";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { useAuth } from "@/contexts/auth";
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
  disabled?: boolean;
  excludeStoreId?: string | null;
}

export function StoreSelector({
  selectedStore,
  onStoreChange,
  label = "Filtrar por sucursal",
  className,
  disabled = false,
  excludeStoreId = null
}: StoreSelectorProps) {
  const { stores: allStores, isLoading } = useStores();
  const { stores: userStores, hasStores } = useCurrentStores();
  const { userRoles } = useAuth();
  
  // Determinar si el usuario es administrador
  const isAdmin = userRoles.some(role => role.role === 'admin');
  
  // Determinar qué tiendas mostrar basado en el rol del usuario
  const storesToShow = isAdmin ? allStores : userStores;
  
  // Filtrar la sucursal excluida si se proporciona
  const filteredStores = excludeStoreId 
    ? storesToShow.filter(store => store.id !== excludeStoreId)
    : storesToShow;

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
        disabled={disabled || filteredStores.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las sucursales</SelectItem>
          {filteredStores.map((store) => (
            <SelectItem key={store.id} value={store.id || "store-without-id"}>
              {store.nombre || "Sin nombre"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
