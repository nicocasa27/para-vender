
import { toast } from 'sonner';

export interface ErrorDetails {
  code?: string;
  message: string;
  context?: string;
  retryable?: boolean;
}

export class AppError extends Error {
  public code?: string;
  public context?: string;
  public retryable: boolean;

  constructor(message: string, code?: string, context?: string, retryable = false) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.retryable = retryable;
  }
}

export function handleError(error: any, context?: string): ErrorDetails {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  // Handle different types of errors
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      context: error.context || context,
      retryable: error.retryable
    };
  }

  // Handle Supabase/PostgreSQL errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        return {
          code: error.code,
          message: 'Ya existe un registro con esos datos',
          context,
          retryable: false
        };
      case '23503': // Foreign key violation
        return {
          code: error.code,
          message: 'No se puede completar la operación: faltan datos relacionados',
          context,
          retryable: false
        };
      case '42501': // Insufficient privilege
        return {
          code: error.code,
          message: 'No tienes permisos para realizar esta acción',
          context,
          retryable: false
        };
      case 'PGRST116': // No rows found
        return {
          code: error.code,
          message: 'No se encontraron datos',
          context,
          retryable: true
        };
      default:
        if (error.message?.includes('recursion') || error.message?.includes('infinite')) {
          return {
            code: 'RECURSION_ERROR',
            message: 'Error de configuración del sistema. Contacta al soporte técnico.',
            context,
            retryable: false
          };
        }
    }
  }

  // Handle network errors
  if (error?.message?.includes('fetch') || 
      error?.message?.includes('network') || 
      error?.message?.includes('timeout')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      context,
      retryable: true
    };
  }

  // Handle generic errors
  const message = error?.message || 'Error desconocido';
  return {
    message,
    context,
    retryable: !message.includes('configuración') && !message.includes('sistema')
  };
}

export function showErrorToast(error: any, context?: string) {
  const errorDetails = handleError(error, context);
  
  toast.error(errorDetails.message, {
    description: errorDetails.context ? `En: ${errorDetails.context}` : undefined,
    action: errorDetails.retryable ? {
      label: "Reintentar",
      onClick: () => window.location.reload()
    } : undefined
  });
}

export function createRetryableFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries = 3,
  delay = 1000
) {
  return async (...args: T): Promise<R> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        const errorDetails = handleError(error);
        
        // Don't retry if error is not retryable
        if (!errorDetails.retryable || attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(2, attempt))
        );
        
        console.log(`Retrying operation (attempt ${attempt + 2}/${maxRetries + 1})`);
      }
    }
    
    throw lastError;
  };
}
