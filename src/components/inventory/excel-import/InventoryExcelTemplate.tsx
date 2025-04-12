
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function InventoryExcelTemplate() {
  const handleDownloadTemplate = () => {
    // Create template data with headers and example rows
    const template = [
      // Headers row
      [
        "Nombre*",
        "Descripción",
        "Precio Compra*",
        "Precio Venta*",
        "Categoría*",
        "Unidad*",
        "Stock Mínimo*",
        "Stock Máximo",
        "Sucursal",
        "Stock Inicial*",
        "Color",
        "Talla"
      ],
      // Example row
      [
        "Producto Ejemplo", 
        "Descripción opcional", 
        "100.00", 
        "150.00", 
        "General", 
        "Unidad", 
        "5", 
        "50", 
        "", 
        "10",
        "Negro",
        "M"
      ],
      // Empty row for user to fill
      ["", "", "", "", "", "", "", "", "", "", "", ""]
    ];

    // Create a new workbook and add the template data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);

    // Add column widths for better readability
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripción
      { wch: 15 }, // Precio Compra
      { wch: 15 }, // Precio Venta
      { wch: 20 }, // Categoría
      { wch: 15 }, // Unidad
      { wch: 15 }, // Stock Mínimo
      { wch: 15 }, // Stock Máximo
      { wch: 20 }, // Sucursal
      { wch: 15 }, // Stock Inicial
      { wch: 15 }, // Color
      { wch: 15 }, // Talla
    ];
    
    ws['!cols'] = colWidths;

    // Add instructions in a separate sheet
    const instructionsData = [
      ["Instrucciones para importar inventario"],
      [""],
      ["Campos requeridos (marcados con *)"],
      ["- Nombre: Nombre del producto (texto)"],
      ["- Precio Compra: Precio de compra del producto (número)"],
      ["- Precio Venta: Precio de venta del producto (número)"],
      ["- Categoría: Nombre de la categoría (debe existir en el sistema o se creará)"],
      ["- Unidad: Nombre de la unidad (debe existir en el sistema o se creará)"],
      ["- Stock Mínimo: Cantidad mínima de stock (número entero)"],
      ["- Stock Inicial: Cantidad inicial a agregar al inventario (número entero)"],
      [""],
      ["Campos opcionales"],
      ["- Descripción: Descripción del producto (texto)"],
      ["- Stock Máximo: Cantidad máxima de stock (número entero)"],
      ["- Sucursal: Nombre de la sucursal donde estará el producto (debe existir en el sistema)"],
      ["- Color: Color del producto (texto)"],
      ["- Talla: Talla o tamaño del producto (texto)"],
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
    wsInstructions['!cols'] = [{ wch: 80 }];

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instrucciones");
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, "plantilla_importacion_inventario.xlsx");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar Plantilla
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Descargar plantilla Excel para importación</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
