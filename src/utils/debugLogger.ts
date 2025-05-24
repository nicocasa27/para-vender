
// Utility para logging de depuración que funciona incluso en casos críticos
export class DebugLogger {
  private static logs: string[] = [];
  
  static log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    // Múltiples formas de logging para asegurar que se capture
    console.log(logEntry, data || '');
    console.error(logEntry, data || ''); // También como error para mayor visibilidad
    
    // Guardar en array para debugging
    this.logs.push(logEntry);
    
    // Almacenar en localStorage como backup
    try {
      const existingLogs = localStorage.getItem('debug_logs') || '[]';
      const allLogs = JSON.parse(existingLogs);
      allLogs.push({ timestamp, message, data });
      localStorage.setItem('debug_logs', JSON.stringify(allLogs.slice(-50))); // Solo últimos 50
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
  
  static getLogs() {
    return this.logs;
  }
  
  static clearLogs() {
    this.logs = [];
    localStorage.removeItem('debug_logs');
  }
  
  static getStoredLogs() {
    try {
      return JSON.parse(localStorage.getItem('debug_logs') || '[]');
    } catch {
      return [];
    }
  }
}
