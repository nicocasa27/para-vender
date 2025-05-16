
/**
 * Utilities for safely handling Supabase queries and results
 */

// Safely get property from an object that might contain errors
export function safeGet<T>(obj: any, key: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  
  try {
    // Check if it's a Supabase error object
    if (obj.error === true) return defaultValue;
    return obj[key] !== undefined ? obj[key] : defaultValue;
  } catch (e) {
    console.warn(`Error accessing property ${key}:`, e);
    return defaultValue;
  }
}

// Get a nested property safely, handling potential errors
export function getNestedProperty<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  
  try {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      // If we encounter an error object or null/undefined, return default
      if (!current || current.error === true) return defaultValue;
      current = current[part];
      if (current === undefined) return defaultValue;
    }
    
    return current === null ? defaultValue : current;
  } catch (e) {
    console.warn(`Error accessing property path ${path}:`, e);
    return defaultValue;
  }
}

// Check if Supabase result has the expected shape
export function isValidResult(data: any, requiredProps: string[]): boolean {
  if (!data || typeof data !== 'object') return false;
  
  return requiredProps.every(prop => {
    try {
      return getNestedProperty(data, prop, undefined) !== undefined;
    } catch (e) {
      return false;
    }
  });
}

// Create a wrapper for safely handling SelectQueryErrors from Supabase
export function wrapSupabaseResult<T>(result: any, transformer: (data: any) => T, defaultValue: T): T {
  if (!result || result.error === true) return defaultValue;
  try {
    return transformer(result);
  } catch (e) {
    console.warn("Error transforming Supabase result:", e);
    return defaultValue;
  }
}

// Cast string to enum safely with fallback
export function safeEnum<T extends string>(value: unknown, validValues: readonly T[], defaultValue: T): T {
  if (typeof value !== 'string') return defaultValue;
  return (validValues as readonly string[]).includes(value) ? (value as T) : defaultValue;
}
