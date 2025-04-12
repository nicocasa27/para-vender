
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { InventoryExcelTemplate } from "./InventoryExcelTemplate";
import { ExcelImportDialog } from "./ExcelImportDialog";

export function ExcelImportButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Importar Excel
      </Button>
      
      <InventoryExcelTemplate />
      
      <ExcelImportDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
}
