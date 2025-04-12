
import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { parseExcelFile } from "./excelImportUtils";
import { ExcelProductPreview } from "./ExcelProductPreview";
import { importProductsFromExcel } from "./excelImportService";

interface ExcelImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelImportDialog({ isOpen, onOpenChange }: ExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  
  const { hasRole } = useAuth();
  const canImport = hasRole('admin') || hasRole('manager');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setIsLoading(true);
    setValidationErrors([]);
    
    try {
      const { data, errors } = await parseExcelFile(file);
      setPreviewData(data);
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        toast.warning(`${errors.length} problemas encontrados`, {
          description: "Revise los errores antes de importar"
        });
      } else if (data.length === 0) {
        toast.error("No se encontraron datos válidos en el archivo");
      } else {
        toast.success(`${data.length} productos listos para importar`);
      }
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      toast.error("Error al procesar el archivo", {
        description: "El formato del archivo no es válido"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImport = async () => {
    if (!selectedFile || previewData.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const result = await importProductsFromExcel(previewData, (progress) => {
        setImportProgress(progress);
      });
      
      if (result.success) {
        toast.success(
          `Importación completada`,
          { description: `${result.imported} productos importados correctamente` }
        );
        onOpenChange(false);
        
        // Reset the state
        setSelectedFile(null);
        setPreviewData([]);
        setValidationErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(
          "Error durante la importación",
          { description: result.error || "Hubo un problema al importar los productos" }
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Error durante la importación");
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Inventario desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel con la lista de productos para agregar al inventario.
            Descarga primero la plantilla para asegurarte de que el formato sea correcto.
          </DialogDescription>
        </DialogHeader>
        
        {!canImport && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos suficientes para importar productos. 
              Se requiere rol de administrador o gerente.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {/* File selection */}
          <div className="space-y-2">
            <label htmlFor="excelFile" className="block text-sm font-medium">
              Seleccionar archivo Excel
            </label>
            <input
              ref={fileInputRef}
              id="excelFile"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={!canImport || isImporting}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              <div className="font-medium">
                Se encontraron los siguientes problemas:
              </div>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Data preview */}
          {previewData.length > 0 && (
            <ExcelProductPreview products={previewData} />
          )}
          
          {/* Import progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Importando productos... ({Math.round(importProgress)}%)
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!selectedFile || isImporting}
          >
            Limpiar
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={!canImport || isImporting || previewData.length === 0 || validationErrors.length > 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Productos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
