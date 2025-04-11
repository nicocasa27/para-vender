
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RefreshCw, Plus, Search, Building } from "lucide-react";
import { Category, Store } from "@/types/inventory";

interface ProductsSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAddNew: () => void;
  categories?: Category[];
  stores?: Store[];
  categoryFilter?: string | null;
  onCategoryChange?: (value: string | null) => void;
  storeFilter?: string | null;
  onStoreChange?: (value: string | null) => void;
}

export function ProductsSearchBar({
  searchTerm,
  onSearchChange,
  onRefresh,
  onAddNew,
  categories = [],
  stores = [],
  categoryFilter = null,
  onCategoryChange,
  storeFilter = null,
  onStoreChange
}: ProductsSearchBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {(categories.length > 0 || stores.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {categories.length > 0 && onCategoryChange && (
            <div className="w-full sm:w-auto">
              <Select
                value={categoryFilter || ""}
                onValueChange={(value) => onCategoryChange(value === "" ? null : value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {stores.length > 0 && onStoreChange && (
            <div className="w-full sm:w-auto">
              <Select
                value={storeFilter || ""}
                onValueChange={(value) => onStoreChange(value === "" ? null : value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <span className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Todas las sucursales" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las sucursales</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
