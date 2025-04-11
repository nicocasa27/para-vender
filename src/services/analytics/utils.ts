
import { toast } from "sonner";

/**
 * Calculates the start date based on the specified time range
 */
export function calculateDateRange(timeRange: string = "month"): { 
  startDate: Date, 
  endDate: Date 
} {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }
  
  return { 
    startDate, 
    endDate: now 
  };
}

/**
 * Handles and logs errors in analytics services
 */
export function handleAnalyticsError(error: any, serviceName: string): never {
  console.error(`Error in ${serviceName}:`, error);
  toast.error(`Error al cargar los datos de ${serviceName}`);
  throw error;
}
