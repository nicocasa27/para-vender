
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plus } from "lucide-react";
import { ExcelImportButton } from "../excel-import/ExcelImportButton";

interface ProductToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  onAddNew: () => void;
}

export function ProductToolbar({
  searchTerm,
  onSearchChange,
  onRefresh,
  onAddNew
}: ProductToolbarProps) {
  return (
    <>
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

      <div className="flex flex-wrap gap-2 bg-accent/30 p-3 rounded-md border">
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-1">Herramientas de Excel</h3>
          <p className="text-xs text-muted-foreground mb-2">Importa o descarga plantillas para gestionar tu inventario</p>
        </div>
        <div className="flex gap-2 items-center">
          <ExcelImportButton />
        </div>
      </div>
    </>
  );
}
