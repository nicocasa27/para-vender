
import { supabase } from "@/integrations/supabase/client";
import { ExcelProduct } from "./excelImportUtils";

interface ImportResult {
  success: boolean;
  imported: number;
  error?: string;
  details?: any;
}

/**
 * Imports products from Excel data into the database
 */
export async function importProductsFromExcel(
  products: ExcelProduct[],
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  if (!products || products.length === 0) {
    return { success: false, imported: 0, error: "No hay productos para importar" };
  }
  
  // Categories, units, and stores mapping
  const categoriesMap = new Map<string, string>();
  const unitsMap = new Map<string, string>();
  const storesMap = new Map<string, string>();
  
  try {
    // Fetch existing categories, units, and stores
    const existingData = await fetchExistingData();
    
    // Create maps for quick lookup
    existingData.categories.forEach(cat => categoriesMap.set(cat.nombre.toLowerCase(), cat.id));
    existingData.units.forEach(unit => unitsMap.set(unit.nombre.toLowerCase(), unit.id));
    existingData.stores.forEach(store => storesMap.set(store.nombre.toLowerCase(), store.id));
    
    // Process products in batches to avoid overwhelming the database
    const batchSize = 10;
    const totalProducts = products.length;
    let importedCount = 0;
    
    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      // Process each product in the batch sequentially
      for (const product of batch) {
        // 1. Find or create category
        let categoryId = categoriesMap.get(product.categoria.toLowerCase());
        if (!categoryId) {
          categoryId = await createCategory(product.categoria);
          if (categoryId) {
            categoriesMap.set(product.categoria.toLowerCase(), categoryId);
          }
        }
        
        // 2. Find or create unit
        let unitId = unitsMap.get(product.unidad.toLowerCase());
        if (!unitId) {
          unitId = await createUnit(product.unidad);
          if (unitId) {
            unitsMap.set(product.unidad.toLowerCase(), unitId);
          }
        }
        
        // 3. Find store if specified
        let storeId = null;
        if (product.sucursal) {
          storeId = storesMap.get(product.sucursal.toLowerCase());
          if (!storeId) {
            console.warn(`Store "${product.sucursal}" not found, skipping assignment`);
          }
        }
        
        // 4. Create product
        const productId = await createProduct({
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio_compra: product.precio_compra,
          precio_venta: product.precio_venta,
          categoria_id: categoryId,
          unidad_id: unitId,
          stock_minimo: product.stock_minimo,
          stock_maximo: product.stock_maximo,
          sucursal_id: storeId,
          color: product.color,
          talla: product.talla
        });
        
        // 5. Create inventory entry if product was created and stock_inicial > 0
        if (productId && product.stock_inicial > 0) {
          await createInventory(productId, storeId, product.stock_inicial);
        }
        
        importedCount++;
        
        // Update progress
        if (onProgress) {
          onProgress((importedCount / totalProducts) * 100);
        }
      }
    }
    
    // Final progress update
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      success: true,
      imported: importedCount
    };
  } catch (error) {
    console.error("Error importing products:", error);
    return {
      success: false,
      imported: 0,
      error: error instanceof Error ? error.message : "Error desconocido durante la importación",
      details: error
    };
  }
}

/**
 * Fetches existing categories, units, and stores from the database
 */
async function fetchExistingData() {
  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categorias')
    .select('id, nombre');
    
  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
    throw categoriesError;
  }
  
  // Fetch units
  const { data: units, error: unitsError } = await supabase
    .from('unidades')
    .select('id, nombre');
    
  if (unitsError) {
    console.error("Error fetching units:", unitsError);
    throw unitsError;
  }
  
  // Fetch stores
  const { data: stores, error: storesError } = await supabase
    .from('almacenes')
    .select('id, nombre');
    
  if (storesError) {
    console.error("Error fetching stores:", storesError);
    throw storesError;
  }
  
  return {
    categories: categories || [],
    units: units || [],
    stores: stores || []
  };
}

/**
 * Creates a new category in the database
 */
async function createCategory(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre: name })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating category:", error);
    return null;
  }
  
  return data.id;
}

/**
 * Creates a new unit in the database
 */
async function createUnit(name: string): Promise<string | null> {
  // Create abbreviation from first character or first word
  const abbreviation = name.length > 0 ? name[0].toLowerCase() : 'u';
  
  const { data, error } = await supabase
    .from('unidades')
    .insert({ 
      nombre: name,
      abreviatura: abbreviation
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating unit:", error);
    return null;
  }
  
  return data.id;
}

/**
 * Creates a new product in the database
 */
async function createProduct(productData: any): Promise<string | null> {
  const { data, error } = await supabase
    .from('productos')
    .insert(productData)
    .select()
    .single();
    
  if (error) {
    console.error("Error creating product:", error);
    return null;
  }
  
  return data.id;
}

/**
 * Creates an inventory entry for a product
 */
async function createInventory(
  productId: string, 
  storeId: string | null, 
  quantity: number
): Promise<boolean> {
  // If no store specified, use the first available store
  if (!storeId) {
    const { data: stores } = await supabase
      .from('almacenes')
      .select('id')
      .limit(1);
      
    if (stores && stores.length > 0) {
      storeId = stores[0].id;
    } else {
      console.error("No stores found for inventory entry");
      return false;
    }
  }
  
  const { error } = await supabase
    .from('inventario')
    .insert({
      producto_id: productId,
      almacen_id: storeId,
      cantidad: quantity
    });
    
  if (error) {
    console.error("Error creating inventory entry:", error);
    return false;
  }
  
  return true;
}
