
/**
 * Safely accesses a property from an object that might be undefined or might cause a TypeScript error
 * @param obj The object to access
 * @param key The key to access
 * @param defaultValue The default value to return if the property doesn't exist
 * @returns The property value or the default value
 */
export function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: any = undefined): any {
  if (!obj) return defaultValue;
  try {
    return (obj as any)[key] ?? defaultValue;
  } catch (error) {
    console.error("Error accessing property:", error);
    return defaultValue;
  }
}

/**
 * Type guard to check if an object is of a specific type
 * @param obj The object to check
 * @param props An array of properties that should exist on the object
 * @returns Boolean indicating if the object has all the specified properties
 */
export function hasProperties<T>(obj: any, props: Array<keyof T>): obj is T {
  if (!obj) return false;
  return props.every(prop => prop in obj);
}

/**
 * Safely cast an unknown object to a specific type
 * @param obj The object to cast
 * @param defaultValue The default value to return if casting fails
 * @returns The cast object or the default value
 */
export function safeCast<T>(obj: unknown, defaultValue: T): T {
  try {
    return obj as T;
  } catch (error) {
    console.error("Error casting object:", error);
    return defaultValue;
  }
}
