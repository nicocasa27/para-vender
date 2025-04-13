
import * as XLSX from "xlsx";

// Define the structure of a product from Excel import
export interface ExcelProduct {
  nombre: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  categoria: string;
  unidad: string;
  stock_minimo: number;
  stock_maximo?: number;
  sucursal?: string;
  stock_inicial: number;
  color?: string;
  talla?: string;
  _row?: number; // For tracking the Excel row number
  _error?: boolean; // For marking rows with errors
}

// Map Excel column names to database field names
const fieldMap: Record<string, string> = {
  "Nombre*": "nombre",
  "Descripción": "descripcion",
  "Precio Compra*": "precio_compra",
  "Precio Venta*": "precio_venta",
  "Categoría*": "categoria",
  "Unidad*": "unidad",
  "Stock Mínimo*": "stock_minimo",
  "Stock Máximo": "stock_maximo",
  "Sucursal": "sucursal",
  "Stock Inicial*": "stock_inicial",
  "Color": "color",
  "Talla": "talla"
};

// Define required fields
const requiredFields = [
  "nombre", 
  "precio_compra", 
  "precio_venta", 
  "categoria", 
  "unidad", 
  "stock_minimo", 
  "stock_inicial"
];

/**
 * Parses an Excel file and returns the structured product data and validation errors
 */
export async function parseExcelFile(file: File): Promise<{ data: ExcelProduct[], errors: string[] }> {
  return new Promise((resolve, reject) => {
    const errors: string[] = [];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find the template sheet (should be named 'Plantilla' but accept any sheet except 'Instrucciones')
        const firstSheet = workbook.SheetNames.find(name => name !== 'Instrucciones') || workbook.SheetNames[0];
        if (!firstSheet) {
          throw new Error('No sheet found in the Excel file');
        }
        
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, blankrows: false });
        
        // Extract header row (first row)
        const headers = jsonData[0] as string[];
        if (!headers || headers.length === 0) {
          throw new Error('No headers found in the Excel file');
        }
        
        // Map headers to field names and check required headers
        const headerMap = new Map<number, string>();
        const missingHeaders: string[] = [];
        
        // Check for required headers
        Object.entries(fieldMap).forEach(([excelHeader, fieldName]) => {
          const isRequired = excelHeader.endsWith('*');
          const headerIndex = headers.findIndex(h => h === excelHeader);
          
          if (headerIndex !== -1) {
            headerMap.set(headerIndex, fieldName);
          } else if (isRequired) {
            missingHeaders.push(excelHeader);
          }
        });
        
        if (missingHeaders.length > 0) {
          errors.push(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        }
        
        const products: ExcelProduct[] = [];
        
        // Skip header row and process data rows
        for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
          const row = jsonData[rowIndex] as any[];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === '')) {
            continue; // Skip empty rows
          }
          
          const product: any = { _row: rowIndex + 1 };
          let hasData = false;
          
          // Extract values based on header mapping
          headerMap.forEach((fieldName, colIndex) => {
            if (colIndex < row.length) {
              const value = row[colIndex];
              if (value !== undefined && value !== null && value !== '') {
                hasData = true;
                
                // Convert values to appropriate types
                if (["precio_compra", "precio_venta"].includes(fieldName)) {
                  product[fieldName] = parseFloat(value);
                }
                else if (["stock_minimo", "stock_maximo", "stock_inicial"].includes(fieldName)) {
                  product[fieldName] = parseInt(value, 10);
                }
                else {
                  product[fieldName] = String(value).trim();
                }
              }
            }
          });
          
          if (hasData) {
            const rowErrors = validateProduct(product, rowIndex + 1);
            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
              product._error = true;
            }
            products.push(product);
          }
        }
        
        resolve({ data: products, errors });
      } catch (error) {
        console.error("Error parsing Excel:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validates a product object against required fields and type constraints
 */
function validateProduct(product: any, rowNumber: number): string[] {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (product[field] === undefined || product[field] === null || product[field] === '') {
      errors.push(`Fila ${rowNumber}: Campo '${field}' es requerido`);
    }
  }
  
  // Validate numeric fields
  if (product.precio_compra !== undefined && (isNaN(product.precio_compra) || product.precio_compra < 0)) {
    errors.push(`Fila ${rowNumber}: Precio de compra debe ser un número válido mayor o igual a 0`);
  }
  
  if (product.precio_venta !== undefined && (isNaN(product.precio_venta) || product.precio_venta <= 0)) {
    errors.push(`Fila ${rowNumber}: Precio de venta debe ser un número válido mayor a 0`);
  }
  
  if (product.stock_minimo !== undefined && (isNaN(product.stock_minimo) || product.stock_minimo < 0)) {
    errors.push(`Fila ${rowNumber}: Stock mínimo debe ser un número entero mayor o igual a 0`);
  }
  
  if (product.stock_maximo !== undefined && product.stock_maximo !== '' && 
      (isNaN(product.stock_maximo) || product.stock_maximo <= 0)) {
    errors.push(`Fila ${rowNumber}: Stock máximo debe ser un número entero mayor a 0`);
  }
  
  if (product.stock_inicial !== undefined && (isNaN(product.stock_inicial) || product.stock_inicial < 0)) {
    errors.push(`Fila ${rowNumber}: Stock inicial debe ser un número entero mayor o igual a 0`);
  }
  
  // Validate stock max is greater than min
  if (product.stock_maximo !== undefined && product.stock_minimo !== undefined &&
      !isNaN(product.stock_maximo) && !isNaN(product.stock_minimo) &&
      product.stock_maximo < product.stock_minimo) {
    errors.push(`Fila ${rowNumber}: Stock máximo debe ser mayor que stock mínimo`);
  }
  
  return errors;
}
