
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Plus } from "lucide-react";

interface TransfersViewProps {
  onRefresh?: () => void;
}

export function TransfersView({ onRefresh }: TransfersViewProps) {
  const [loading, setLoading] = useState(false);
  
  const handleRefresh = () => {
    setLoading(true);
    
    // Simulamos una carga
    setTimeout(() => {
      setLoading(false);
      if (onRefresh) onRefresh();
      toast.info("Información de transferencias actualizada");
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Transferencias de Inventario</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transferencia
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transferencias entre sucursales</CardTitle>
          <CardDescription>
            Gestione el movimiento de productos entre sucursales
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          La funcionalidad de transferencias está en desarrollo.
        </CardContent>
      </Card>
    </div>
  );
}
