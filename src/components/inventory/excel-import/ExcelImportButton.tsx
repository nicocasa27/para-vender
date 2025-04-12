
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, FileUp } from "lucide-react";
import { InventoryExcelTemplate } from "./InventoryExcelTemplate";
import { ExcelImportDialog } from "./ExcelImportDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ExcelImportButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              Importar Excel
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Importar inventario desde archivo Excel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <InventoryExcelTemplate />
      
      <ExcelImportDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
}
