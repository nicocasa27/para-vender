
import { supabase } from "@/integrations/supabase/client";

/**
 * Safely transform Supabase query results to ensure type safety
 * @param data Raw data from Supabase query
 * @param transformer Function to transform each item
 * @returns Array of transformed items
 */
export function transformSupabaseData<T, R>(
  data: T[] | null | undefined,
  transformer: (item: T) => R
): R[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map(item => transformer(item));
}

/**
 * Safely extract a property from a Supabase query result
 * @param obj Object that might contain a nested property
 * @param path Path to the property (e.g., "almacenes.nombre")
 * @param defaultValue Default value if property doesn't exist
 * @returns The property value or default
 */
export function extractProperty<T = any>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  try {
    if (!obj) return defaultValue;
    
    // Handle SelectQueryError objects
    if (obj.error === true) return defaultValue;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return (current === null || current === undefined) ? defaultValue : current as T;
  } catch (error) {
    console.error(`Error extracting property ${path}:`, error);
    return defaultValue;
  }
}

/**
 * Cast string to enum safely with fallback
 * @param value Value to cast
 * @param validValues Array of valid enum values
 * @param defaultValue Default value to use if cast fails
 * @returns Safely cast value
 */
export function safeCast<T extends string>(value: unknown, validValues: readonly T[], defaultValue: T): T {
  if (typeof value !== 'string') return defaultValue;
  return (validValues as readonly string[]).includes(value) ? (value as T) : defaultValue;
}

/**
 * Type guard for checking if an object came from Supabase with the expected structure
 * @param obj Object to check
 * @param requiredFields Fields that must exist on the object
 * @returns Boolean indicating if the object has the required structure
 */
export function isValidSupabaseResult(obj: any, requiredFields: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return requiredFields.every(field => {
    const parts = field.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || !current.hasOwnProperty(part)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  });
}

/**
 * Create a typed selector for Supabase responses
 * Use with explicit table name literals instead of dynamic string values
 * @param tableName Table to query
 * @returns A function that queries the table and returns typed data
 */
export function createTypedSelector<T>(tableName: string) {
  // Using any type for the selector since we can't easily constrain it to the specific database schema
  return async (query: string) => {
    const { data, error } = await supabase.from(tableName as any).select(query);
    if (error) throw error;
    return data as T[];
  };
}

/**
 * Check if a value is a Supabase SelectQueryError
 */
export function isSelectQueryError(value: any): boolean {
  return value && typeof value === 'object' && value.error === true;
}

/**
 * Check if an object is a Supabase error object
 */
export function isErrorObject(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.error === true;
}
