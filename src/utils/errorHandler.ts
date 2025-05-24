
import { toast } from 'sonner';
import { DebugLogger } from './debugLogger';

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
  DebugLogger.log(`🚨 ERROR HANDLER START`, {
    context,
    errorType: typeof error,
    errorName: error?.name,
    errorMessage: error?.message,
    errorCode: error?.code,
    errorStack: error?.stack,
    fullError: error
  });

  // Handle different types of errors
  if (error instanceof AppError) {
    DebugLogger.log("✅ ErrorHandler: Handling AppError");
    return {
      code: error.code,
      message: error.message,
      context: error.context || context,
      retryable: error.retryable
    };
  }

  // Handle Supabase/PostgreSQL errors
  if (error?.code) {
    DebugLogger.log(`🔍 ErrorHandler: Handling Supabase/PostgreSQL error with code: ${error.code}`);
    switch (error.code) {
      case '23505': // Unique constraint violation
        DebugLogger.log("🔄 ErrorHandler: Unique constraint violation");
        return {
          code: error.code,
          message: 'Ya existe un registro con esos datos',
          context,
          retryable: false
        };
      case '23503': // Foreign key violation
        DebugLogger.log("🔗 ErrorHandler: Foreign key violation");
        return {
          code: error.code,
          message: 'No se puede completar la operación: faltan datos relacionados',
          context,
          retryable: false
        };
      case '42501': // Insufficient privilege
        DebugLogger.log("🔒 ErrorHandler: Insufficient privilege");
        return {
          code: error.code,
          message: 'No tienes permisos para realizar esta acción',
          context,
          retryable: false
        };
      case 'PGRST116': // No rows found
        DebugLogger.log("📭 ErrorHandler: No rows found");
        return {
          code: error.code,
          message: 'No se encontraron datos',
          context,
          retryable: true
        };
      case '42P17': // Infinite recursion
        DebugLogger.log("💥 ErrorHandler: CRITICAL - Infinite recursion detected!", {
          message: error.message,
          context,
          fullError: error
        });
        return {
          code: 'RECURSION_ERROR',
          message: 'Error de configuración del sistema. Contacta al soporte técnico.',
          context,
          retryable: false
        };
      default:
        DebugLogger.log(`❓ ErrorHandler: Unknown database error code: ${error.code}`);
        if (error.message?.includes('recursion') || error.message?.includes('infinite')) {
          DebugLogger.log("💥 ErrorHandler: Recursion detected in error message");
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
    DebugLogger.log("🌐 ErrorHandler: Network error detected");
    return {
      code: 'NETWORK_ERROR',
      message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      context,
      retryable: true
    };
  }

  // Handle generic errors
  const message = error?.message || 'Error desconocido';
  DebugLogger.log(`🔄 ErrorHandler: Generic error handling: ${message}`);
  
  return {
    message,
    context,
    retryable: !message.includes('configuración') && !message.includes('sistema')
  };
}

export function showErrorToast(error: any, context?: string) {
  DebugLogger.log("🍞 ErrorHandler: Showing error toast", { context });
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
    
    DebugLogger.log(`🔁 ErrorHandler: Starting retryable function with ${maxRetries} max retries`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        DebugLogger.log(`🎯 ErrorHandler: Attempt ${attempt + 1}/${maxRetries + 1}`);
        return await fn(...args);
      } catch (error) {
        lastError = error;
        DebugLogger.log(`❌ ErrorHandler: Attempt ${attempt + 1} failed:`, error);
        
        const errorDetails = handleError(error);
        
        // Don't retry if error is not retryable
        if (!errorDetails.retryable || attempt === maxRetries) {
          DebugLogger.log("🛑 ErrorHandler: Not retrying - either not retryable or max attempts reached");
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        DebugLogger.log(`⏱️ ErrorHandler: Waiting ${waitTime}ms before retry`);
        await new Promise(resolve => 
          setTimeout(resolve, waitTime)
        );
        
        DebugLogger.log(`🔄 ErrorHandler: Retrying operation (attempt ${attempt + 2}/${maxRetries + 1})`);
      }
    }
    
    throw lastError;
  };
}
