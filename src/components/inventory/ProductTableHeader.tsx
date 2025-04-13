
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, DownloadCloud, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, Store } from "@/types/inventory";
import { ExcelImportButton } from "./excel-import/ExcelImportButton";
import { InventoryExcelTemplate } from "./excel-import/InventoryExcelTemplate";
import { useAuth } from "@/contexts/auth";

interface ProductTableHeaderProps {
  onAddProduct: () => void;
  onRefresh: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (categoryId: string | null) => void;
  storeFilter: string | null;
  setStoreFilter: (storeId: string | null) => void;
  categories: Category[];
  stores: Store[];
}

const ProductTableHeader = ({
  onAddProduct,
  onRefresh,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  storeFilter,
  setStoreFilter,
  categories,
  stores
}: ProductTableHeaderProps) => {
  const { hasRole } = useAuth();
  const canAddProducts = hasRole('admin') || hasRole('manager');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="flex flex-row gap-2">
          {canAddProducts && (
            <Button onClick={onAddProduct}>
              Agregar Producto
            </Button>
          )}
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          {canAddProducts && (
            <div className="flex gap-2">
              <ExcelImportButton />
              <InventoryExcelTemplate />
            </div>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={categoryFilter || ""}
          onValueChange={(value) => setCategoryFilter(value || null)}
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

        <Select
          value={storeFilter || ""}
          onValueChange={(value) => setStoreFilter(value || null)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todas las sucursales" />
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
    </div>
  );
};

export default ProductTableHeader;
