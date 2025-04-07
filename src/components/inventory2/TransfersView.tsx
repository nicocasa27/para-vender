
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTransferForm } from "../inventory/stock-transfer/StockTransferForm";
import { TransferHistory } from "../inventory/stock-transfer/TransferHistory";

interface TransfersViewProps {
  onRefresh?: () => void;
}

export function TransfersView({ onRefresh }: TransfersViewProps) {
  const [refreshHistoryToggle, setRefreshHistoryToggle] = useState(false);

  const handleTransferSuccess = () => {
    setRefreshHistoryToggle(!refreshHistoryToggle);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="transfer">
        <TabsList>
          <TabsTrigger value="transfer">Transferir Stock</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transfer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transferir Inventario</CardTitle>
              <CardDescription>
                Mueva productos entre sucursales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockTransferForm onTransferSuccess={handleTransferSuccess} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transferencias</CardTitle>
              <CardDescription>
                Últimas transferencias realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransferHistory key={refreshHistoryToggle.toString()} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
