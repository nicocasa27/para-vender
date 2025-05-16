
/**
 * Utilities for safely handling Supabase response data
 */

// Safely get property from potentially nested object
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | null {
  if (!obj) return null;
  return obj[key];
}

// For safely accessing nested properties from Supabase relations
export function safeGetNested<T, K1 extends keyof T, K2 extends keyof NonNullable<T[K1]>>(
  obj: T | null | undefined, 
  key1: K1, 
  key2: K2
): NonNullable<T[K1]>[K2] | null {
  if (!obj) return null;
  const value1 = obj[key1];
  if (!value1) return null;
  return (value1 as any)[key2];
}

// Cast any string to a specific enum type with fallback
export function safeCast<T extends string>(value: unknown, validValues: T[], defaultValue: T): T {
  if (typeof value !== 'string') return defaultValue;
  return validValues.includes(value as T) ? (value as T) : defaultValue;
}

// Type guard for checking if a value is not null or undefined
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Parse JSON safely
export function safeParseJson<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return defaultValue;
  }
}

// Create a typed selector for Supabase responses
export function createTypedSelector<T>(tableName: string) {
  return async (query: string) => {
    const { data, error } = await (supabase as any).from(tableName).select(query);
    if (error) throw error;
    return data as T[];
  };
}
