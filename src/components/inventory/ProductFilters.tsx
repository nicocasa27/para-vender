
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, Store } from "@/types/inventory";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  storeFilter: string;
  setStoreFilter: (value: string) => void;
  categories: Category[];
  stores: Store[];
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  storeFilter,
  setStoreFilter,
  categories,
  stores,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="relative">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-categories">Todas las categorías</SelectItem>
          {categories
            .filter(category => !!category.id)
            .map((category) => (
              <SelectItem key={category.id} value={category.id || "cat-sin-id"}>
                {category.nombre || "Categoría sin nombre"}
              </SelectItem>
            ))
          }
        </SelectContent>
      </Select>

      <Select value={storeFilter} onValueChange={setStoreFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por sucursal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-stores">Todas las sucursales</SelectItem>
          {stores
            .filter(store => !!store.id)
            .map((store) => (
              <SelectItem key={store.id} value={store.id || "store-sin-id"}>
                {store.nombre || "Sucursal sin nombre"}
              </SelectItem>
            ))
          }
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductFilters;
