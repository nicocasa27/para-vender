
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DebugLogger } from '@/utils/debugLogger';

export function DebugNotifications() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newLogsCount, setNewLogsCount] = useState(0);

  useEffect(() => {
    // Cargar logs existentes
    const storedLogs = DebugLogger.getStoredLogs();
    setLogs(storedLogs);

    // Escuchar nuevos logs
    const handleDebugLog = (event: CustomEvent) => {
      const { message, data, timestamp } = event.detail;
      const newLog = { message, data, timestamp };
      
      setLogs(prev => [...prev, newLog].slice(-50));
      setNewLogsCount(prev => prev + 1);
      
      // Mostrar toast para errores críticos
      if (message.includes('ERROR') || message.includes('CRITICAL')) {
        toast.error(`🐛 Debug: ${message}`, {
          description: data ? JSON.stringify(data).substring(0, 100) : undefined
        });
      }
    };

    window.addEventListener('debug-log', handleDebugLog as EventListener);
    
    return () => {
      window.removeEventListener('debug-log', handleDebugLog as EventListener);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setNewLogsCount(0);
    }
  };

  const clearLogs = () => {
    DebugLogger.clearLogs();
    setLogs([]);
    setNewLogsCount(0);
    toast.success('Logs eliminados');
  };

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}${log.data ? `\n${JSON.stringify(log.data, null, 2)}` : ''}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(logText);
    toast.success('Logs copiados al portapapeles');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="relative shadow-lg"
          >
            <Bell className="h-4 w-4 mr-2" />
            Debug Logs
            {newLogsCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {newLogsCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="w-96 mt-2 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>🐛 Debug Logs ({logs.length})</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={copyLogs}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearLogs}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay logs disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {logs.slice(-20).map((log, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-2 text-xs">
                        <div className="font-mono text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="font-medium">{log.message}</div>
                        {log.data && (
                          <pre className="text-blue-600 text-[10px] mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
