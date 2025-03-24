
import { PostgrestError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

/**
 * A hook that provides standardized error handling for Supabase queries
 */
export function useSupabaseQuery() {
  const { toast } = useToast();

  const handleError = (error: PostgrestError | Error, customMessage?: string) => {
    console.error("Supabase query error:", error);
    
    // Use UI toast for more serious errors
    if (customMessage) {
      toast({
        title: "Error",
        description: customMessage,
        variant: "destructive",
      });
    } else {
      // Use sonner toast for standard errors
      sonnerToast.error(
        "Error de consulta", 
        {
          description: error instanceof PostgrestError 
            ? error.message 
            : "Error al conectar con la base de datos"
        }
      );
    }
  };

  /**
   * Safely execute a Supabase query with error handling
   */
  const executeQuery = async <T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        handleError(error, errorMessage);
        return null;
      }
      
      return data;
    } catch (error) {
      handleError(error as Error, errorMessage);
      return null;
    }
  };

  return { executeQuery, handleError };
}
